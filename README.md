# Quantum Board — Render Web Service

## Render
- Service: Web Service
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

## Chat room
The site includes a password-gated friend chat room. The current demo password is configured in the client as `132`.

Note: posts and chat messages are stored in memory, so a Render restart clears them. For persistent group data, use a database such as Postgres.

## Google Chat webhook
Set the Render environment variable `GOOGLE_CHAT_WEBHOOK_URL` to your Google Chat incoming-webhook URL. Keep the URL private and do not commit it to GitHub.


## Login
The board now requires a username and password. New accounts can be created from the login screen. For this lightweight version, accounts and sessions are stored in memory, so a Render restart clears them. For persistent accounts, connect the app to a database such as Postgres.

## Google Chat webhook
Keep the Google Chat webhook private. Configure the replacement webhook URL in Render as the `GOOGLE_CHAT_WEBHOOK_URL` environment variable; never commit it to GitHub or put it in the browser code.
