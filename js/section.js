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
  var elAddBtn = document.getElementById("btn-add");
  var elAddedBadge = document.getElementById("added-badge");
  var elLastText = document.getElementById("last-added-text");

  // ── Helpers ────────────────────────────────────────────────

  /**
   * Format a JS Date to the ICS datetime string: YYYYMMDDTHHmmssZ
   */
  function toICSDate(date) {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }

  /**
   * Escape special characters required by the iCalendar spec (RFC 5545).
   */
  function escapeICS(str) {
    return String(str)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  /**
   * Fold long lines to 75 octets as required by RFC 5545.
   */
  function foldLine(line) {
    if (line.length <= 75) return line;
    var result = "";
    while (line.length > 75) {
      result += line.slice(0, 75) + "\r\n ";
      line = line.slice(75);
    }
    return result + line;
  }

  /**
   * Build an .ics string for a single Trello card event.
   * Using the card's Trello ID as the UID means re-exporting the
   * same card will update the existing Calendar event (same UID → update).
   */
  function buildICS(card) {
    var dueDate = new Date(card.due);
    var endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // +1 hour
    var now = new Date();

    var lines = [
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
    ];

    return lines.join("\r\n");
  }

  /**
   * Open a helper page (download.html) in a new, un-sandboxed tab.
   * That page triggers the .ics download from a normal browsing context so
   * macOS reliably opens the file in Calendar.app.
   *
   * Encoding: btoa(unescape(encodeURIComponent(icsContent))) handles UTF-8
   * card names safely within a URL hash fragment.
   */
  // Use origin + pathname (never href) so Trello's JWT hash fragment
  // doesn't corrupt the base path when section.html is loaded.
  var BASE_URL = (window.location.origin + window.location.pathname).replace(/\/[^/]*$/, "/");

  function downloadICS(icsContent) {
    var encoded = btoa(unescape(encodeURIComponent(icsContent)));
    var popup = window.open(BASE_URL + "download.html#" + encoded, "_blank");
    // Fallback: if the popup was blocked, try a direct download from the iframe
    if (!popup || popup.closed) {
      var blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "trello-event.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    }
  }

  /**
   * Sanitise a string so it can be used as a filename.
   */
  function safeFilename(name) {
    return (
      name
        .replace(/[^a-z0-9_\-\s]/gi, "")
        .trim()
        .replace(/\s+/g, "_") || "trello-event"
    );
  }

  // ── Show / hide helpers ────────────────────────────────────
  function show(el) {
    el.classList.remove("hidden");
  }
  function hide(el) {
    el.classList.add("hidden");
  }

  // ── Main logic ─────────────────────────────────────────────
  t.render(function () {
    return t
      .card("id", "name", "due", "shortUrl")
      .then(function (card) {
        hide(elLoading);

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

        // Check if we've already exported this card
        return t
          .get("card", "private", "calendarLastAdded")
          .then(function (lastAdded) {
            if (lastAdded) {
              var when = new Date(lastAdded);
              elLastText.textContent =
                "Last exported " +
                when.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              show(elLastText);
            }
            t.sizeTo("#app").catch(function () {});
          });
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

  // ── Button handler (exposed globally for the inline onclick) ─
  window.addToCalendar = function () {
    t.card("id", "name", "due", "shortUrl")
      .then(function (card) {
        if (!card.due) return;

        var icsContent = buildICS(card);
        downloadICS(icsContent);

        // Persist the export timestamp so badges update
        return t
          .set("card", "private", "calendarLastAdded", new Date().toISOString())
          .then(function () {
            // Update the UI
            hide(elAddBtn);
            show(elAddedBadge);

            var now = new Date();
            elLastText.textContent =
              "Last exported " +
              now.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            show(elLastText);

            t.sizeTo("#app").catch(function () {});

            // Restore the button after a few seconds
            setTimeout(function () {
              hide(elAddedBadge);
              show(elAddBtn);
            }, 4000);
          });
      })
      .catch(function (err) {
        console.error(
          "[Apple Calendar Power-Up] Error adding to calendar:",
          err,
        );
      });
  };
})();
