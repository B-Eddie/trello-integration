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
  var pollStarted = false;
  var currentSubUrl = "";
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

  function renderState(card, boardId) {
    hide(elLoading);

    if (boardId) {
      var subUrl = buildSubscriptionUrl(boardId);
      currentSubUrl = subUrl;
      elSubLink.href = subUrl;
      elSubLink.textContent = subUrl;
      elCalendarFeedLink.disabled = false;
    } else {
      currentSubUrl = "";
      elSubLink.removeAttribute("href");
      elSubLink.textContent = "Board ID not available in this context.";
      elCalendarFeedLink.disabled = true;
    }

    if (!card.due) {
      show(elNoDue);
      hide(elHasDue);
      t.sizeTo("#app").catch(function () {});
      return;
    }

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
  }

  // ── Main logic ─────────────────────────────────────────────
  t.render(function () {
    var context = t.getContext() || {};
    var boardId = context.board || context.idBoard || "";
    var lastDueValue = null;

    return t
      .card("id", "name", "due")
      .then(function (card) {
        lastDueValue = card.due || "";
        renderState(card, boardId);

        // Poll card due date so adding/removing due date updates UI immediately
        // without requiring card close/reopen.
        if (!pollStarted) {
          pollStarted = true;
          setInterval(function () {
            t.card("id", "name", "due")
              .then(function (latestCard) {
                var nextDue = latestCard.due || "";
                if (nextDue !== lastDueValue) {
                  lastDueValue = nextDue;
                  renderState(latestCard, boardId);
                }
              })
              .catch(function () {});
          }, 3000);
        }
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

  window.forceRefreshFeed = function () {
    if (!currentSubUrl) {
      return;
    }

    var originalText = elCalendarFeedLink.textContent;
    elCalendarFeedLink.disabled = true;
    elCalendarFeedLink.textContent = "Refreshing...";

    var separator = currentSubUrl.indexOf("?") >= 0 ? "&" : "?";
    var refreshUrl = currentSubUrl + separator + "refresh=" + Date.now();

    fetch(refreshUrl, {
      cache: "no-store",
      headers: {
        Pragma: "no-cache",
      },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Request failed: " + response.status);
        }
        return response.text();
      })
      .then(function () {
        elCalendarFeedLink.textContent = "Feed Updated";
        setTimeout(function () {
          elCalendarFeedLink.textContent = originalText;
          elCalendarFeedLink.disabled = false;
        }, 1500);
      })
      .catch(function () {
        elCalendarFeedLink.textContent = "Refresh Failed";
        setTimeout(function () {
          elCalendarFeedLink.textContent = originalText;
          elCalendarFeedLink.disabled = false;
        }, 1800);
      });
  };
})();
