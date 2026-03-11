function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  var result = '';
  while (line.length > 75) {
    result += line.slice(0, 75) + '\r\n ';
    line = line.slice(75);
  }
  return result + line;
}

function buildICS(card) {
  var dueDate = new Date(card.due);
  var endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
  var now = new Date();
  var cardUrl = card.url || '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trello Apple Calendar Power-Up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + card.id + '@trello-apple-calendar-powerup',
    'DTSTAMP:' + toICSDate(now),
    'DTSTART:' + toICSDate(dueDate),
    'DTEND:' + toICSDate(endDate),
    foldLine('SUMMARY:' + escapeICS(card.name)),
    foldLine('DESCRIPTION:' + escapeICS('Trello card: ' + cardUrl)),
    foldLine('URL:' + cardUrl),
    'SEQUENCE:0',
    'LAST-MODIFIED:' + toICSDate(now),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

module.exports = async function handler(req, res) {
  try {
    var cardId = req.query.cardId;
    if (!cardId) {
      res.status(400).send('Missing cardId query param');
      return;
    }

    function cleanEnv(value) {
      if (!value) return '';
      return String(value).trim().replace(/^['\"]|['\"]$/g, '');
    }

    var key = cleanEnv(process.env.TRELLO_API_KEY || process.env.TRELLO_KEY);
    var token = cleanEnv(process.env.TRELLO_API_TOKEN || process.env.TRELLO_TOKEN);

    if (!key || !token) {
      res.status(500).send('Missing env vars. Set TRELLO_API_KEY and TRELLO_API_TOKEN in Vercel, then redeploy.');
      return;
    }

    // Basic sanity checks before calling Trello API.
    if (!/^[a-f0-9]{32}$/i.test(key)) {
      res.status(500).send('TRELLO_API_KEY format looks invalid. Expected a 32-char hex key.');
      return;
    }

    var fields = 'id,name,due,url,dateLastActivity';
    var endpoint =
      'https://api.trello.com/1/cards/' +
      encodeURIComponent(cardId) +
      '?fields=' +
      encodeURIComponent(fields) +
      '&key=' +
      encodeURIComponent(key) +
      '&token=' +
      encodeURIComponent(token);

    var response = await fetch(endpoint);
    if (!response.ok) {
      var body = await response.text();
      if (response.status === 401) {
        res.status(401).send(
          'Trello auth failed (invalid key/token). Check Vercel env vars TRELLO_API_KEY and TRELLO_API_TOKEN, ensure no quotes/spaces, then redeploy.'
        );
        return;
      }
      res.status(response.status).send('Trello API error: ' + body);
      return;
    }

    var card = await response.json();
    if (!card.due) {
      res.status(409).send('Card has no due date');
      return;
    }

    var ics = buildICS(card);
    var etag = 'W/"' + card.id + '-' + new Date(card.dateLastActivity).getTime() + '"';

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
    res.setHeader('ETag', etag);
    res.status(200).send(ics);
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
};
