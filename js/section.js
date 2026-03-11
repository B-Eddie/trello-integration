/* =============================================================
   Trello → Apple Calendar Power-Up  |  section.js
   Runs inside the card-back-section iframe.
   Reads the Trello card context, lets the user download an .ics
   file that macOS adds directly to Apple Calendar.
   ============================================================= */

(function () {
  "use strict";

  // ── Trello iframe context ──────────────────────────────────
  var t = TrelloPowerUp.iframe();

  // ── DOM refs ───────────────────────────────────────────────
  var elLoading = document.getElementById("loading");
  var elNoDue = document.getElementById("no-due");
  var elHasDue = document.getElementById("has-due");
  var elDueLabel = document.getElementById("due-date-label");
  var elCalendarFeedLink = document.getElementById("calendar-feed-link");
  var elSubLink = document.getElementById("sub-link");
  var BASE_URL = (window.location.origin + window.location.pathname).replace(
    /\/[^/]*$/,
    "/",
  );

  // ── Show / hide helpers ────────────────────────────────────
  function show(el) {
    el.classList.remove("hidden");
  }
  function hide(el) {
    el.classList.add("hidden");
  }

  function buildSubscriptionUrl(boardId) {
    return BASE_URL + "api/ics?boardId=" + encodeURIComponent(boardId);
  }

  // ── Main logic ─────────────────────────────────────────────
  t.render(function () {
    var context = t.getContext() || {};
    var boardId = context.board || context.idBoard || "";

    return t
      .card("id", "name", "due")
      .then(function (card) {
        hide(elLoading);

        // One stable board-level URL that Apple Calendar can poll for updates.
        if (boardId) {
          var subUrl = buildSubscriptionUrl(boardId);
          elSubLink.href = subUrl;
          elSubLink.textContent = subUrl;
          elCalendarFeedLink.href = subUrl;
        } else {
          elSubLink.removeAttribute("href");
          elSubLink.textContent = "Board ID not available in this context.";
          elCalendarFeedLink.removeAttribute("href");
        }

        if (!card.due) {
          show(elNoDue);
          hide(elHasDue);
          t.sizeTo("#app").catch(function () {});
          return;
        }

        // Format the due date for display
        var dueDate = new Date(card.due);
        elDueLabel.textContent = dueDate.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        show(elHasDue);
        hide(elNoDue);
        t.sizeTo("#app").catch(function () {});
      })
      .catch(function (err) {
        // If card context is unavailable (e.g. JWT expired, iframe not yet
        // connected), fall back gracefully rather than staying stuck on "Loading".
        console.error("[Apple Calendar Power-Up] render error:", err);
        hide(elLoading);
        show(elNoDue);
        elNoDue.querySelector("p").textContent =
          "Couldn't load card data. Please close and reopen the card.";
        t.sizeTo("#app").catch(function () {});
      });
  });
})();
