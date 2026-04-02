# AccessPath Demo Flow

This app is set up for a fast 2-minute demo across the main operational surfaces.

## Demo Flow

1. Start on `/login`
   - Use the real sign-in or signup flow.
   - Confirm successful auth redirects into `/dashboard`.

2. Open `/dashboard`
   - Highlight the KPI cards and recent interactions table.
   - Mention that the shell uses consistent loading and empty-state patterns across routes.

3. Open global search with `Ctrl+K`
   - Type `inv` and jump to `/inventory`.
   - Type `Northwind` or `cs-1042` to show direct navigation into a customer conversation.

4. Visit `/inventory`
   - Use the filters to narrow the stock table.
   - Click an `Apply` button in `AI Actions` to show the toast interaction.

5. Visit `/logistics`
   - Click `Optimize Routes`.
   - Call out the temporary optimizing state, toast feedback, and updated savings estimate KPI.

6. Visit `/integrations`
   - Connect Shopify or test another connector.
   - Call out that Salesforce access depends on the real authenticated workspace plan.

7. Visit `/reports`
   - Use filters to change the KPI totals and rows.
   - Click `Export PDF` on Free/Pro to show plan-based gating.

8. Visit `/workflow-builder`
   - Show the Pro+ gate if the authenticated workspace is still on Free.
   - Add a node, select it, edit it, and load a template.

9. Visit `/settings`
   - Show admin/agent role gating based on the authenticated session role.
   - Save a settings change and point out the audit log table.

## Key Pages

- `/dashboard`
- `/customer-service`
- `/customer-service/cs-1042`
- `/inventory`
- `/logistics`
- `/integrations`
- `/reports`
- `/workflow-builder`
- `/settings`

## Demo Notes

- Authenticated app state now comes from the real server session.
- Plan and role gating are derived from the authenticated session payload, not local mock auth state.
- Local state and localStorage still back non-auth demo surfaces like workflow edits and conversation state.
- Customer service detail state now uses versioned localStorage keys with safe migration from legacy keys.

## Auth Manual Verification

1. Local development secret behavior
   - Run the app locally without `AUTH_SECRET`.
   - Confirm auth routes still work in development.
   - In any non-development environment, set `AUTH_SECRET` explicitly.

2. Signup payload safety
   - Call `POST /api/auth/signup`.
   - Confirm the response only includes public session fields:
     `authenticated`, `user`, `plan`, `role`, `expiresAt`.
   - Confirm it never returns `passwordHash`, `emailNormalized`, `tokenHash`, `ipAddress`, `userAgent`, or internal status values.

3. Generic invalid-credentials behavior
   - Call `POST /api/auth/signin` with a wrong email.
   - Call it again with a real email and wrong password.
   - Confirm both return the same generic invalid-credentials message.

4. Signout cookie clearing
   - Sign in, then manually delete the matching session record from `data/auth/sessions.json`.
   - Call `POST /api/auth/signout`.
   - Confirm the auth cookie is still cleared even though the backing session no longer exists.
   - Confirm the endpoint still returns a successful signout response.

5. Expired session cleanup
   - Set a stored session `expiresAt` in the past.
   - Call `GET /api/auth/session`.
   - Confirm the response becomes unauthenticated and the expired record is deleted on lookup.

 6. Remember-me expiry behavior
    - Sign in once with `rememberMe=false` and inspect the auth cookie expiry/maxAge.
    - Sign in again with `rememberMe=true` and confirm the cookie expiry is extended.

 7. Unauthenticated API access
    - While signed out, call:
      `/api/dashboard`, `/api/insights`, `/api/integrations`, `/api/chat`, and `/api/schedule`.
    - Confirm each returns `401` and does not rely on shell/page protection.

 8. Protected app-shell routes
    - While signed out, open any route under `/(app-shell)` such as `/dashboard` or `/workflow-builder`.
    - Confirm the request is redirected to `/login/secure`.
