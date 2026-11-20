import { z } from "zod";

/** Local calendar date as YYYY-MM-DD (event dates are stored as plain dates). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isUpcoming(eventDate: string, today: string = todayISO()): boolean {
  return eventDate >= today;
}

export type RegistrationStatus = "Registered" | "Cancelled" | "Attended";
export type MembershipStatus = "Pending" | "Active" | "Rejected";

/** Students can cancel only a Registered spot for an event that has not happened yet. */
export function canCancelRegistration(
  status: RegistrationStatus,
  eventDate: string,
  today: string = todayISO(),
): boolean {
  return status === "Registered" && isUpcoming(eventDate, today);
}

/** Students can re-register after cancelling, while the event is upcoming and its club is Active. */
export function canReRegister(
  status: RegistrationStatus,
  eventDate: string,
  clubActive: boolean,
  today: string = todayISO(),
): boolean {
  return status === "Cancelled" && clubActive && isUpcoming(eventDate, today);
}

/** Feedback opens only once an admin has marked the registration Attended. */
export function canGiveFeedback(status: RegistrationStatus): boolean {
  return status === "Attended";
}

/** Pending requests first, then newest first. */
export function sortPendingFirst<T extends { status: MembershipStatus; join_date: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const ap = a.status === "Pending" ? 0 : 1;
    const bp = b.status === "Pending" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return b.join_date.localeCompare(a.join_date);
  });
}

/** Events sorted by date, then start time. */
export function sortByDate<T extends { event_date: string; start_time: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time),
  );
}

export const ADMIN_EMAIL = "admin@campus.edu";

const phoneRegex = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(80, "Shorten your name to 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address, like name@campus.edu.")
    .max(255, "Use an email address under 255 characters.")
    .refine((v) => v !== ADMIN_EMAIL, "This address is reserved for the registry admin. Use your own email."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a phone number with 8–20 digits, e.g. +880 1712-345678."),
  department: z
    .string()
    .trim()
    .min(2, "Enter your department, e.g. Computer Science.")
    .max(80, "Shorten the department name to 80 characters or fewer."),
  semester: z.coerce
    .number({ invalid_type_error: "Choose your current semester." })
    .int("Choose a whole semester number.")
    .min(1, "Semester must be between 1 and 12.")
    .max(12, "Semester must be between 1 and 12."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    .max(72, "Keep your password under 72 characters.")
    .regex(/[A-Za-z]/, "Add at least one letter to your password.")
    .regex(/[0-9]/, "Add at least one number to your password."),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the email you registered with."),
  password: z.string().min(1, "Enter your password."),
});

export const clubSchema = z.object({
  club_name: z
    .string()
    .trim()
    .min(3, "Give the club a name of at least 3 characters.")
    .max(80, "Keep the club name under 80 characters."),
  category: z
    .string()
    .trim()
    .min(2, "Add a category, e.g. Arts, Technology or Sports.")
    .max(40, "Keep the category under 40 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter the club's contact email, like club@campus.edu."),
  description: z
    .string()
    .trim()
    .min(10, "Describe the club in at least 10 characters so students know what it does.")
    .max(600, "Keep the description under 600 characters."),
  established_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the date the club was established.")
    .refine((v) => v <= todayISO(), "The established date can't be in the future."),
  status: z.enum(["Active", "Inactive"]),
});
export type ClubInput = z.infer<typeof clubSchema>;

export const eventSchema = z
  .object({
    club_id: z.string().uuid("Choose the club hosting this event."),
    event_name: z
      .string()
      .trim()
      .min(3, "Give the event a name of at least 3 characters.")
      .max(100, "Keep the event name under 100 characters."),
    description: z
      .string()
      .trim()
      .max(600, "Keep the description under 600 characters."),
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the event date."),
    start_time: z.string().regex(/^\d{2}:\d{2}/, "Pick a start time."),
    end_time: z.string().regex(/^\d{2}:\d{2}/, "Pick an end time."),
    venue: z
      .string()
      .trim()
      .min(2, "Add a venue, e.g. Auditorium B.")
      .max(100, "Keep the venue under 100 characters."),
  })
  .refine((v) => v.end_time.slice(0, 5) > v.start_time.slice(0, 5), {
    path: ["end_time"],
    message: "End time must be later than the start time.",
  });
export type EventInput = z.infer<typeof eventSchema>;

export const feedbackSchema = z
  .string()
  .trim()
  .min(3, "Write at least a few words of feedback.")
  .max(1000, "Keep feedback under 1000 characters.");

/** Turn database errors into messages that explain how to fix the problem. */
export function friendlyError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  const msg = e?.message ?? "Something went wrong. Please try again.";
  if (e?.code === "23505") {
    if (msg.includes("club_name")) return "A club with this name already exists. Choose a different name.";
    if (msg.includes("clubs_email")) return "Another club already uses this email. Use a different contact email.";
    if (msg.includes("memberships")) return "You've already requested to join this club.";
    if (msg.includes("event_registrations")) return "You're already registered for this event.";
    return "That record already exists.";
  }
  if (e?.code === "42501" || msg.includes("row-level security")) {
    return "This action isn't allowed. The club may be inactive or registration may be closed.";
  }
  if (msg.includes("Invalid login credentials")) return "That email and password don't match. Check both and try again.";
  if (msg.includes("Email not confirmed")) return "Confirm your email first — check your inbox for the link we sent.";
  if (msg.includes("User already registered")) return "An account with this email already exists. Sign in instead.";
  return msg;
}
