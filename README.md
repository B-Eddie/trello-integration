# Trello → Apple Calendar Power-Up

A Trello Power-Up that syncs cards with Apple Calendar. Click the **"Sync to Apple Calendar"** button at the top of your board, select which cards you want, and all `.ics` files download automatically — no credentials or API keys required.

---

## How it works

1. Open your Trello board.
2. Click the **"Sync to Apple Calendar"** button at the top of the board (in the header).
3. A popup window opens showing all cards with due dates.
4. Select which cards you want to sync (or **Select All**).
5. Click **"Sync Selected to Calendar"** → all .ics files download automatically.
6. Double-click each .ics file in your Downloads folder → Calendar.app adds the events.

Re-exporting the same card (e.g. after a due-date change) updates the existing Calendar event because the `.ics` UID is tied to the Trello card ID.

---

## Project structure

```
trello-integration/
├── index.html      ← Power-Up connector (Trello's entry point)
├── sync.html       ← Board sync UI (popup window)
├── download.html   ← ICS file trigger & instructions
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
   - `board-buttons`
   - `board-badges`
5. Click **Save**.

---

### Step 4 — Add the Power-Up to a board

1. Open the Trello board you want to use.
2. Click **Power-Ups** in the board menu (right side).
3. Click **Add Power-Ups** → search for **Apple Calendar Sync**.
4. Click **Add** → **Done**.

---

### Step 5 — Test it

1. Refresh the board — you should see **"Sync to Apple Calendar"** button at the top in the board header.
2. Click the button → a popup opens showing all cards with due dates.
3. Select the cards you want to sync (or **Select All**).
4. Click **"Sync Selected to Calendar"** → .ics files download.
5. In your Downloads folder, double-click each `.ics` file → Calendar.app prompts you to add the event. Click **OK**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No "Sync to Apple Calendar" button | Make sure `board-buttons` capability is enabled in Power-Up settings. Reload the board. |
| "This site can't be reached" | The Power-Up URL must be HTTPS. Use GitHub Pages, Netlify, or Vercel. |
| Popup doesn't open | Check if your browser is blocking popups. Allow popups for Trello. |
| .ics file doesn't open Calendar.app | Double-click the `.ics` file in Downloads manually. |
| No cards appear in the sync popup | Make sure cards on the board have due dates set. |
| Duplicate events in Calendar | Delete the old event; re-syncing will update the Calendar event via matching UID. |
