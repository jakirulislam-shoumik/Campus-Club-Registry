<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Data access goes from the browser straight to the database through the generated client; every permission rule lives in RLS policies and guard triggers, so never rely on UI checks alone.
- Roles live only in `public.user_roles` and are checked with `has_role()`; the designated admin email is provisioned by an auth trigger only after the address is confirmed.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/login`); student pages sit under the `_student` layout and admin pages under `admin/`, each gating by role.
- Business rules (cancel/feedback/ordering) and form validation live in `src/lib/rules.ts` with tests in `src/test/rules.test.ts`; keep UI and database rules in step.
- Visual language (ledger cards, stamps, top bar, tabs) is defined as component classes in `src/styles.css`; reuse them instead of ad hoc styles.
