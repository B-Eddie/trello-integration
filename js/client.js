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

  function buildBoardFeedUrl(boardId) {
    return BASE_URL + "api/ics?boardId=" + encodeURIComponent(boardId);
  }

  function openBoardFeed(t) {
    var context = t.getContext() || {};
    var boardId = context.board || context.idBoard || "";

    if (!boardId) {
      return t.alert({
        message: "Could not resolve board ID for calendar feed.",
        duration: 8,
      });
    }

    window.open(buildBoardFeedUrl(boardId), "_blank");
    return Promise.resolve();
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
              return openBoardFeed(t);
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
          text: "Open board calendar feed",
          callback: function (t) {
            return openBoardFeed(t);
          },
        },
      ];
    },
  });

  console.log("[Power-Up] Initialized with board-buttons and card-buttons");
})();
