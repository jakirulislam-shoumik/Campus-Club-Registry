import { describe, expect, it } from "vitest";
import {
  canCancelRegistration,
  canGiveFeedback,
  canReRegister,
  clubSchema,
  eventSchema,
  registerSchema,
  sortByDate,
  sortPendingFirst,
} from "@/lib/rules";

const TODAY = "2026-11-20";

describe("registration cancel rule", () => {
  it("allows cancelling a Registered spot for an upcoming event", () => {
    expect(canCancelRegistration("Registered", "2026-11-27", TODAY)).toBe(true);
  });
  it("allows cancelling on the day of the event", () => {
    expect(canCancelRegistration("Registered", TODAY, TODAY)).toBe(true);
  });
  it("blocks cancelling after the event date", () => {
    expect(canCancelRegistration("Registered", "2026-11-19", TODAY)).toBe(false);
  });
  it("blocks cancelling an Attended registration", () => {
    expect(canCancelRegistration("Attended", "2026-11-27", TODAY)).toBe(false);
  });
});

describe("re-register rule", () => {
  it("allows re-registering a cancelled spot for an upcoming event of an active club", () => {
    expect(canReRegister("Cancelled", "2026-11-27", true, TODAY)).toBe(true);
  });
  it("blocks re-registering when the club is inactive", () => {
    expect(canReRegister("Cancelled", "2026-11-27", false, TODAY)).toBe(false);
  });
});

describe("feedback rule", () => {
  it("opens feedback only after Attended", () => {
    expect(canGiveFeedback("Attended")).toBe(true);
    expect(canGiveFeedback("Registered")).toBe(false);
    expect(canGiveFeedback("Cancelled")).toBe(false);
  });
});

describe("membership request ordering", () => {
  it("lists Pending requests first", () => {
    const rows = sortPendingFirst([
      { id: "a", status: "Active" as const, join_date: "2026-11-19" },
      { id: "b", status: "Pending" as const, join_date: "2026-11-01" },
      { id: "c", status: "Rejected" as const, join_date: "2026-11-20" },
    ]);
    expect(rows[0]?.id).toBe("b");
  });
});

describe("events ordering", () => {
  it("sorts upcoming events by date then start time", () => {
    const rows = sortByDate([
      { id: "late", event_date: "2026-12-01", start_time: "10:00" },
      { id: "pm", event_date: "2026-11-25", start_time: "15:00" },
      { id: "am", event_date: "2026-11-25", start_time: "09:00" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["am", "pm", "late"]);
  });
});

const validStudent = {
  name: "Ayesha Rahman",
  email: "ayesha@campus.edu",
  phone: "+880 1712-345678",
  department: "Computer Science",
  semester: "3",
  password: "campus2026",
};

describe("student registration validation", () => {
  it("accepts a complete registration", () => {
    expect(registerSchema.safeParse(validStudent).success).toBe(true);
  });
  it("rejects semester 13", () => {
    expect(registerSchema.safeParse({ ...validStudent, semester: "13" }).success).toBe(false);
  });
  it("rejects a password without a number", () => {
    expect(registerSchema.safeParse({ ...validStudent, password: "onlyletters" }).success).toBe(false);
  });
  it("reserves the admin email", () => {
    expect(registerSchema.safeParse({ ...validStudent, email: "admin@campus.edu" }).success).toBe(false);
  });
});

describe("club and event validation", () => {
  it("rejects an end time before the start time", () => {
    const r = eventSchema.safeParse({
      club_id: "7f1c2a7e-2d7f-4b8e-9a59-1a2b3c4d5e6f",
      event_name: "Workshop",
      description: "",
      event_date: "2026-12-01",
      start_time: "15:00",
      end_time: "14:00",
      venue: "Room 101",
    });
    expect(r.success).toBe(false);
  });
  it("only allows Active or Inactive club status", () => {
    const r = clubSchema.safeParse({
      club_name: "Chess Circle",
      category: "Games",
      email: "chess@campus.edu",
      description: "Weekly rapid and blitz games.",
      established_date: "2020-01-01",
      status: "Paused",
    });
    expect(r.success).toBe(false);
  });
});
