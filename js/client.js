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
  var ATTACHMENT_SECTION_ICON = BASE_URL + "img/icon-dark.svg";

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
    var cardUrl = card.url || "";
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
      foldLine("DESCRIPTION:" + escapeICS("Trello card: " + cardUrl)),
      foldLine("URL:" + cardUrl),
      "SEQUENCE:0",
      "LAST-MODIFIED:" + toICSDate(now),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  function openCardInCalendar(t) {
    return t.card("id", "name", "due", "url").then(function (card) {
      if (!card.due) {
        return t.alert({
          message: "Add a due date first, then sync to Apple Calendar.",
          duration: 6,
        });
      }

      var icsContent = buildICS(card);
      var encoded = btoa(unescape(encodeURIComponent(icsContent)));
      window.open(BASE_URL + "download.html#" + encoded, "_blank");

      return t.set(
        "card",
        "private",
        "calendarLastAdded",
        new Date().toISOString(),
      );
    });
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

    /* ── Attachment section (shown above card attachments) ───── */
    "attachment-sections": function (t, options) {
      var entries = (options && options.entries) || [];

      // Attachment sections must claim at least one attachment entry.
      // We claim all URL attachments so the section appears reliably on
      // cards that contain attachments.
      var claimed = entries.filter(function (entry) {
        return entry && entry.url;
      });

      if (!claimed.length) {
        return [];
      }

      return [
        {
          id: "apple-calendar-sync",
          claimed: claimed,
          icon: ATTACHMENT_SECTION_ICON,
          title: "Apple Calendar Sync",
          content: {
            type: "iframe",
            url: t.signUrl(BASE_URL + "section.html"),
            height: 120,
          },
        },
      ];
    },

    /* ── Card sidebar button (reliable fallback) ─────────────── */
    "card-buttons": function () {
      return [
        {
          icon: BASE_URL + "img/icon-dark.svg",
          text: "Sync this card to Apple Calendar",
          callback: function (t) {
            return openCardInCalendar(t);
          },
        },
      ];
    },
  });

  console.log("[Power-Up] Initialized with board-buttons and card-buttons");
})();
