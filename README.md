# Quantum Board — Render Web Service

## Render
- Service: Web Service
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

## Push notifications
Set these Render environment variables for cross-device notifications:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:you@example.com`)

Generate VAPID keys locally with `npx web-push generate-vapid-keys`.

Note: this demo stores posts/subscriptions in memory. Use a database such as Postgres for persistence before relying on it for a real group.
