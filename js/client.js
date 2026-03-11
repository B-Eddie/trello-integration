/* =============================================================
   Trello → Apple Calendar Power-Up  |  client.js

   Architecture note
   -----------------
   We intentionally do NOT use card-back-section (iframe type) because
   that requires TrelloPowerUp.iframe() to relay postMessages through the
   connector frame — which breaks with cross-origin mismatches.

   Instead we use card-buttons: the callback runs directly inside the
   connector frame where the Trello context (t) is always valid. We build
   the ICS here and open download.html via window.open(), which is allowed
   by Trello's sandbox (allow-popups).
   ============================================================= */

(function () {
  "use strict";

  // Base URL derived from origin + pathname only (never href) so that
  // Trello's JWT hash appended to index.html doesn't corrupt the path.
  var BASE_URL = (window.location.origin + window.location.pathname).replace(
    /\/[^/]*$/,
    "/",
  );

  // Trello board-buttons expects an icon object with variants for
  // light and dark board backgrounds.
  var CALENDAR_ICON = {
    dark: BASE_URL + "img/icon-light.svg",
    light: BASE_URL + "img/icon-dark.svg",
  };

  // ── ICS helpers ──────────────────────────────────────────────
  function toICSDate(date) {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }

  function escapeICS(str) {
    return String(str)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function foldLine(line) {
    if (line.length <= 75) return line;
    var result = "";
    while (line.length > 75) {
      result += line.slice(0, 75) + "\r\n ";
      line = line.slice(75);
    }
    return result + line;
  }

  function buildICS(card) {
    var dueDate = new Date(card.due);
    var endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
    var now = new Date();
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Trello Apple Calendar Power-Up//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + card.id + "@trello-apple-calendar-powerup",
      "DTSTAMP:" + toICSDate(now),
      "DTSTART:" + toICSDate(dueDate),
      "DTEND:" + toICSDate(endDate),
      foldLine("SUMMARY:" + escapeICS(card.name)),
      foldLine("DESCRIPTION:" + escapeICS("Trello card: " + card.shortUrl)),
      foldLine("URL:" + card.shortUrl),
      "SEQUENCE:0",
      "LAST-MODIFIED:" + toICSDate(now),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  // ── Power-Up registration ─────────────────────────────────────
  TrelloPowerUp.initialize({
    /* ── Board button (top of board) ──────────────────────────── */
    "board-buttons": function (t) {
      console.log("[Power-Up] board-buttons callback triggered");
      try {
        return [
          {
            icon: CALENDAR_ICON,
            text: "Sync to Apple Calendar",
            condition: "always",
            callback: function (t) {
              console.log("[Power-Up] button clicked");
              // Pass the board context to sync.html via window.open
              window.trelloPowerUpContext = t;
              window.open(
                BASE_URL + "sync.html",
                "sync",
                "width=700,height=600",
              );
            },
          },
        ];
      } catch (err) {
        console.error("[Power-Up] Error in board-buttons:", err);
        return [];
      }
    },
  });

  console.log("[Power-Up] Initialized with board-buttons capability");
})();
