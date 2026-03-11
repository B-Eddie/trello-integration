# Trello → Apple Calendar Power-Up

A Trello Power-Up that syncs cards with Apple Calendar.

- Auto-updating subscription: one stable board feed URL and subscribe once in Apple Calendar so updates are pulled automatically.

---

## How it works

1. Open a card with a due date.
2. In **Apple Calendar Sync** section, click the single feed link.
3. In Apple Calendar, use **File → New Calendar Subscription...** and paste that URL.
4. Apple Calendar will periodically re-fetch this URL and pull due-date changes automatically.

---

## Project structure

```
trello-integration/
├── index.html      ← Power-Up connector (Trello's entry point)
├── api/
│   ├── ics.js      ← Live board ICS endpoint (one URL for all due cards)
│   └── card-ics.js ← Live single-card ICS endpoint
├── js/
│   └── client.js   ← Registers Power-Up capabilities
├── css/
│   └── style.css   ← Styles
└── package.json    ← Dev server config
```

---

## Step-by-step setup guide

### Step 1 — Install dependencies

```bash
cd trello-integration
npm install
```

---

### Step 2 — Host the Power-Up (choose one option)

Power-Ups **must** be served over HTTPS. Use one of the options below.

If you want auto-updating subscription links, use **Vercel** and set environment variables:

- `TRELLO_API_KEY`
- `TRELLO_API_TOKEN`

These are used by `api/ics.js` to fetch live board card data and generate ICS on demand.

---

#### Option A — GitHub Pages (recommended, free, permanent)

1. Create a new GitHub repository (e.g. `trello-apple-calendar`).
2. Push this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial Power-Up"
   git remote add origin https://github.com/YOUR_USERNAME/trello-apple-calendar.git
   git push -u origin main
   ```
3. In the GitHub repo → **Settings** → **Pages** → Source: `main` branch, root folder → **Save**.
4. Your connector URL will be:  
   `https://YOUR_USERNAME.github.io/trello-apple-calendar/index.html`

---

#### Option B — Netlify (drag & drop, instant HTTPS)

1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the entire `trello-integration` folder onto the page.
3. Netlify gives you a URL like `https://amazing-name-123.netlify.app`.
4. Your connector URL will be:  
   `https://amazing-name-123.netlify.app/index.html`

---

#### Option C — ngrok (local dev only)

> Good for testing. The URL changes every time you restart ngrok unless you have a paid account.

```bash
# Terminal 1 — start the local server
npm start

# Terminal 2 — expose it over HTTPS
npm run tunnel
# → copy the https://xxxx.ngrok.io URL
```

Your connector URL will be: `https://xxxx.ngrok.io/index.html`

---

### Step 3 — Create the Power-Up in Trello

1. Go to **[https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)**.
2. Click **"New"** (top right).
3. Fill in:
   - **Name**: `Apple Calendar Sync`
   - **Workspace**: choose your workspace
   - **Connector URL**: paste the URL from Step 2 (e.g. `https://…/index.html`)
4. Under **Capabilities**, enable:
   - `attachment-sections`
   - `card-buttons`
   - `board-buttons`
5. Click **Save**.

---

### Step 4 — Add the Power-Up to a board

1. Open the Trello board you want to use.
2. Click **Power-Ups** in the board menu (right side).
3. Click **Add Power-Ups** → search for **Apple Calendar Sync**.
4. Click **Add** → **Done**.

---

### Step 5 — Test it

1. Open any card and add a due date.
2. Add any attachment to the card (a link or file).
3. Reopen the card and look above the attachments area for **Apple Calendar Sync** section.
4. Copy the displayed feed URL.
5. In Apple Calendar: **File → New Calendar Subscription...** and paste the link.
6. Save the subscription.
7. Change any card due date on that board and wait for Apple Calendar refresh (or refresh manually) to confirm auto-update.

---

## Troubleshooting

| Problem                           | Fix                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| No Apple Calendar section on card | Make sure `attachment-sections` is enabled and the card has at least one attachment. |
| No card sidebar sync button       | Make sure `card-buttons` capability is enabled in Power-Up settings.                 |
| No board-level sync button        | Make sure `board-buttons` capability is enabled in Power-Up settings.                |
| "This site can't be reached"      | The Power-Up URL must be HTTPS. Use GitHub Pages, Netlify, or Vercel.                |
| Feed link does not open           | Ensure your Power-Up is hosted over HTTPS and reachable from Trello.                 |
| Duplicate events in Calendar      | Delete the old event; re-syncing will update the Calendar event via matching UID.    |
| Subscription URL returns error    | Set `TRELLO_API_KEY` and `TRELLO_API_TOKEN` in Vercel project settings and redeploy. |
