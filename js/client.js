/* =============================================================
   Trello → Apple Calendar Power-Up  |  client.js
   Registers Power-Up capabilities with Trello.
   ============================================================= */

(function () {
  'use strict';

  // Small calendar SVG used as the section icon (data URI)
  var CALENDAR_ICON =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
      'fill="none" stroke="%23555" stroke-width="2">' +
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
      '<line x1="16" y1="2" x2="16" y2="6"/>' +
      '<line x1="8" y1="2" x2="8" y2="6"/>' +
      '<line x1="3" y1="10" x2="21" y2="10"/>' +
      '</svg>'
    );

  TrelloPowerUp.initialize({

    /* ── Card-back section ─────────────────────────────────── */
    'card-back-section': function (t) {
      return {
        title: 'Apple Calendar',
        icon: CALENDAR_ICON,
        content: {
          type: 'iframe',
          // t.signUrl appends the Trello context JWT so section.js can
          // call t.card() inside the iframe.
          url: t.signUrl('./section.html'),
          height: 88
        }
      };
    },

    /* ── Card-detail badge (shown on the card back header) ─── */
    'card-detail-badges': function (t) {
      return t.get('card', 'private', 'calendarLastAdded')
        .then(function (lastAdded) {
          if (!lastAdded) return [];

          var when = new Date(lastAdded);
          var label =
            'Added to Calendar ' +
            when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

          return [
            {
              text: label,
              icon: CALENDAR_ICON,
              color: 'green'
            }
          ];
        });
    },

    /* ── Card badges (compact, shown on the board) ─────────── */
    'card-badges': function (t) {
      return t.get('card', 'private', 'calendarLastAdded')
        .then(function (lastAdded) {
          if (!lastAdded) return [];
          return [
            {
              icon: CALENDAR_ICON,
              text: 'In Calendar',
              color: 'green'
            }
          ];
        });
    }

  });
}());
