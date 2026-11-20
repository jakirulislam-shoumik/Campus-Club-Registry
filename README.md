# Campus Club Registry

A club registration and membership system for a university. Students register, browse clubs,
request membership and sign up for events. Admins manage clubs, events, membership requests and
attendance.

Built with React 19 + TypeScript, TanStack Start (Vite), Tailwind CSS v4, shadcn/ui, and a
Postgres backend with Auth and Row Level Security (Lovable Cloud).

## Features

**Students** (`/register`, `/login`)
- **Clubs**: card grid of active clubs with a **Request to join** button; once requested, a status stamp shows the result.
- **My Memberships**: club, join date, role and status.
- **Events**: upcoming events sorted by date, a **Register** button, and a *Club member* badge for clubs you're an active member of.
- **My Registrations**: cancel upcoming events; leave feedback after an admin marks you *Attended*.

**Admins** (`/admin/*`, admins only)
- **Clubs**: create, edit, activate / deactivate, with active member counts.
- **Membership Requests**: pending first, Approve / Reject, pending-count badge on the tab.
- **Events**: create and edit events for a club, with registration counts.
- **Event Registrations**: view all, filter by event, mark Attended.
- **Students**: searchable list.

## Local setup

Requirements: Node.js 20+ and npm.

```sh
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:8080
npm test               # unit tests for the business rules
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (publishable/anon) key — safe for the browser; data is protected by RLS |

Only these two are needed by the app. Never put a service-role key in a `VITE_` variable.

## Database

The schema lives in `drizzle/migrations/*.sql` (apply them in order on a fresh project). Tables:

- `students` — profile per student (id = auth user id). Created automatically on sign-up.
- `admins` — admin profile (`Super Admin` / `Club Admin`).
- `user_roles` — `admin` / `student`, checked by the security-definer function `has_role()` in RLS policies. Roles are never stored on profile tables.
- `clubs`, `memberships` (unique student + club), `events`, `event_registrations` (unique student + event).

Key rules enforced in the database:
- Students read active clubs and all events, and only their own profile, memberships and registrations.
- A membership request is always inserted as `Pending` / `Member`; only admins can approve, reject or change roles.
- Event registration requires the event's club to be `Active` and the event not to have passed.
- Students can only cancel an upcoming registration (or re-register a cancelled one) and add feedback once marked `Attended`.
- Passwords are handled by Auth only — never stored in app tables.

### Seed data

Migrations seed three clubs (Photography Society, Competitive Programming Club, Debate Union) and
one upcoming event for each.

### Setting up the admin account (`admin@campus.edu`)

The database automatically turns **admin@campus.edu** into the Super Admin as soon as that address
is confirmed. Self-sign-up with that email is blocked in the app, and an unconfirmed sign-up never
gets admin rights.

- **Lovable Cloud**: open *Cloud → Users → Add user → Create new user*, enter `admin@campus.edu`
  and the password you want. The account is created confirmed and becomes the admin immediately.
- **Your own Supabase project**: *Authentication → Users → Add user*, enter the email and password
  and tick *Auto confirm user*.

To change the password later, delete that user and create it again with the new password (the
admin profile is restored automatically).

## Deploying from GitHub

1. Connect the project to GitHub from Lovable (*GitHub → Connect*). Every change syncs both ways.
2. The simplest way to go live is **Publish** in Lovable, which builds and hosts the app.
3. To host elsewhere (Vercel, Netlify), import the GitHub repo, set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings, and use the host's
   TanStack Start preset. The production build targets an edge worker by default, so a plain
   static-site deploy is not supported without changing the build target.
4. Add your deployed URL to the backend's allowed redirect URLs so confirmation emails link back
   to your site.
