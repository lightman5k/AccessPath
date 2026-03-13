# AccessPath Demo Flow

This app is set up for a fast 2-minute demo across the main operational surfaces.

## Demo Flow

1. Start on `/dashboard`
   - Highlight the KPI cards and recent interactions table.
   - Mention that the shell uses consistent loading and empty-state patterns across routes.

2. Open global search with `Ctrl+K`
   - Type `inv` and jump to `/inventory`.
   - Type `Northwind` or `cs-1042` to show direct navigation into a customer conversation.

3. Visit `/inventory`
   - Use the filters to narrow the stock table.
   - Click an `Apply` button in `AI Actions` to show the toast interaction.

4. Visit `/logistics`
   - Click `Optimize Routes`.
   - Call out the temporary optimizing state, toast feedback, and updated savings estimate KPI.

5. Visit `/integrations`
   - Connect Shopify or test another connector.
   - Switch the mock plan in the topbar to show Salesforce unlocking on Pro+.

6. Visit `/reports`
   - Use filters to change the KPI totals and rows.
   - Click `Export PDF` on Free/Pro to show gating, then switch to Premium and try again.

7. Visit `/workflow-builder`
   - Show the Pro+ gate from Free, then switch plan and enter.
   - Add a node, select it, edit it, and load a template.

8. Visit `/settings`
   - Show admin/agent role gating.
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

- The topbar plan and role selectors drive feature gating globally.
- Local state and localStorage are mocked for demo continuity across refreshes.
- Customer service detail state now uses versioned localStorage keys with safe migration from legacy keys.
