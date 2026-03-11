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

function cleanEnv(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .replace(/^['\"]|['\"]$/g, "");
}

function buildCalendar(cards) {
  var now = new Date();
  var lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trello Apple Calendar Power-Up//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  cards.forEach(function (card) {
    if (!card.due) return;

    var dueDate = new Date(card.due);
    var endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
    var cardUrl = card.url || "";

    lines.push(
      "BEGIN:VEVENT",
      "UID:" + card.id + "@trello-apple-calendar-powerup",
      "DTSTAMP:" + toICSDate(now),
      "DTSTART:" + toICSDate(dueDate),
      "DTEND:" + toICSDate(endDate),
      foldLine("SUMMARY:" + escapeICS(card.name)),
      foldLine("DESCRIPTION:" + escapeICS("Trello card: " + cardUrl)),
      foldLine("URL:" + cardUrl),
      "SEQUENCE:0",
      "LAST-MODIFIED:" + toICSDate(new Date(card.dateLastActivity || now)),
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

module.exports = async function handler(req, res) {
  try {
    var boardId = req.query.boardId || cleanEnv(process.env.TRELLO_BOARD_ID);
    if (!boardId) {
      res
        .status(400)
        .send(
          "Missing boardId. Pass ?boardId=... or set TRELLO_BOARD_ID env var.",
        );
      return;
    }

    var key = cleanEnv(process.env.TRELLO_API_KEY || process.env.TRELLO_KEY);
    var token = cleanEnv(
      process.env.TRELLO_API_TOKEN || process.env.TRELLO_TOKEN,
    );

    if (!key || !token) {
      res
        .status(500)
        .send(
          "Missing env vars. Set TRELLO_API_KEY and TRELLO_API_TOKEN in Vercel, then redeploy.",
        );
      return;
    }

    var fields = "id,name,due,url,dateLastActivity";
    var endpoint =
      "https://api.trello.com/1/boards/" +
      encodeURIComponent(boardId) +
      "/cards?filter=open&fields=" +
      encodeURIComponent(fields) +
      "&key=" +
      encodeURIComponent(key) +
      "&token=" +
      encodeURIComponent(token);

    var response = await fetch(endpoint);
    if (!response.ok) {
      var body = await response.text();
      if (response.status === 401) {
        res
          .status(401)
          .send(
            "Trello auth failed (invalid key/token). Check TRELLO_API_KEY and TRELLO_API_TOKEN.",
          );
        return;
      }
      res.status(response.status).send("Trello API error: " + body);
      return;
    }

    var cards = await response.json();
    var dueCards = cards.filter(function (c) {
      return !!c.due;
    });

    var maxActivity = dueCards.reduce(function (maxTs, card) {
      var ts = new Date(card.dateLastActivity || 0).getTime();
      return Math.max(maxTs, ts);
    }, 0);

    var etag =
      'W/"' + boardId + "-" + dueCards.length + "-" + maxActivity + '"';
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    var ics = buildCalendar(dueCards);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=300",
    );
    res.setHeader("ETag", etag);
    res.status(200).send(ics);
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
};
