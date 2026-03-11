/* =============================================================
   Trello → Apple Calendar Power-Up  |  client.js
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
  var SECTION_ICON = BASE_URL + "img/icon-dark.svg";

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
    /* ── Card back section (always shown) ─────────────────────── */
    "card-back-section": function (t) {
      return {
        title: "Apple Calendar Sync",
        icon: SECTION_ICON,
        content: {
          type: "iframe",
          url: t.signUrl(BASE_URL + "section.html"),
          height: 120,
        },
      };
    },

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
