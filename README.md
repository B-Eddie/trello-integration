# Trello → Apple Calendar Power-Up

A Trello Power-Up that syncs cards with Apple Calendar. When a Trello card has a due date, an **"Apple Calendar"** section appears on the card back. Clicking **"Add to Apple Calendar"** downloads an `.ics` file that macOS automatically opens in Calendar.app — no credentials or API keys required.

---

## How it works

1. Open any Trello card that has a due date.
2. A green **"Sync to Calendar"** badge appears at the top of the card (under the title).
3. Click the badge → a new tab opens with your `.ics` file.
4. macOS downloads the file and Calendar.app opens it, prompting you to add the event.
5. Done — the event is now in your Apple Calendar.

Re-exporting the same card (e.g. after a due-date change) updates the existing Calendar event because the `.ics` UID is tied to the Trello card ID.

---

## Project structure

```
trello-integration/
├── index.html      ← Power-Up connector (Trello's entry point)
├── section.html    ← Card-back section UI
├── js/
│   ├── client.js   ← Registers Power-Up capabilities
│   └── section.js  ← ICS generation & download logic
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
   - `card-back-section`
   - `card-detail-badges`
   - `card-badges`
5. Click **Save**.

---

### Step 4 — Add the Power-Up to a board

1. Open the Trello board you want to use.
2. Click **Power-Ups** in the board menu (right side).
3. Click **Add Power-Ups** → search for **Apple Calendar Sync**.
4. Click **Add** → **Done**.

---

### Step 5 — Test it

1. Open any card on the board.
2. Set a due date (click **Due Date** in the card sidebar).
3. Close and reopen the card — you should see an **Apple Calendar** section.
4. Click **"Add to Apple Calendar"**.
5. macOS will prompt you to add the event to Calendar.app. Click **OK**.

---

## Troubleshooting

| Problem                              | Fix                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| Section doesn't appear               | Make sure the card has a due date set. Reload the board.                      |
| "This site can't be reached"         | The Power-Up URL must be HTTPS. Use GitHub Pages or Netlify.                  |
| Calendar doesn't open after download | Check your Downloads folder for the `.ics` file and double-click it manually. |
| Badge doesn't update                 | Reload the page — Trello caches badges for a few seconds.                     |
| Duplicate events in Calendar         | Delete the old event; re-importing will update via matching UID.              |
