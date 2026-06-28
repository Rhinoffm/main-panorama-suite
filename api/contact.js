const rateLimit = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const MAX_BODY_BYTES = 32 * 1024;
const MIN_SUBMIT_MS = 3000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripNewlines(str) {
  return String(str).replace(/[\r\n]+/g, " ").trim();
}

function trimField(value, maxLen) {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

function isValidEmail(email) {
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const maxDay = month === 2 && isLeap ? 29 : daysInMonth[month - 1];
  return day <= maxDay;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function buildEmailContent(fields) {
  const {
    vorname,
    nachname,
    email,
    tel,
    an,
    ab,
    pers,
    msg,
    requestedAt,
  } = fields;
  const name = `${vorname} ${nachname}`.trim();
  const telDisplay = tel || "–";
  const msgDisplay = msg || "–";

  const text = [
    "Unverbindliche Buchungsanfrage",
    "",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${telDisplay}`,
    `Anreise: ${an}`,
    `Abreise: ${ab}`,
    `Gästezahl: ${pers}`,
    "",
    "Nachricht:",
    msgDisplay,
    "",
    `Zeitpunkt der Anfrage: ${requestedAt}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Unverbindliche Buchungsanfrage</title></head>
<body style="font-family:sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 16px;">Unverbindliche Buchungsanfrage</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;">
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Name</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">E-Mail</td><td style="padding:6px 0;">${escapeHtml(email)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Telefon</td><td style="padding:6px 0;">${escapeHtml(telDisplay)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Anreise</td><td style="padding:6px 0;">${escapeHtml(an)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Abreise</td><td style="padding:6px 0;">${escapeHtml(ab)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Gästezahl</td><td style="padding:6px 0;">${escapeHtml(String(pers))}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Nachricht</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(msgDisplay)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;">Zeitpunkt</td><td style="padding:6px 0;">${escapeHtml(requestedAt)}</td></tr>
  </table>
</body>
</html>`;

  return { name, text, html };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return jsonResponse(res, 405, { error: "Method not allowed." });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch (err) {
    if (err.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse(res, 413, { error: "Request too large." });
    }
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  const website = trimField(data.website, 200);
  if (website) {
    return jsonResponse(res, 200, { success: true });
  }

  const formLoadedAt = Number(data.formLoadedAt);
  if (!Number.isFinite(formLoadedAt) || formLoadedAt <= 0) {
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  if (Date.now() - formLoadedAt < MIN_SUBMIT_MS) {
    return jsonResponse(res, 200, { success: true });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonResponse(res, 429, {
      error:
        "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut.",
    });
  }

  const submissionId = trimField(data.submissionId, 36);
  if (!UUID_RE.test(submissionId)) {
    return jsonResponse(res, 400, { error: "Invalid request." });
  }

  const vorname = stripNewlines(trimField(data.vorname, 60));
  const nachname = stripNewlines(trimField(data.nachname, 60));
  const email = stripNewlines(trimField(data.email, 254));
  const tel = trimField(data.tel, 50);
  const an = trimField(data.an, 10);
  const ab = trimField(data.ab, 10);
  const msg = trimField(data.msg, 3000);

  if (!vorname || !nachname) {
    return jsonResponse(res, 400, { error: "Bitte geben Sie Ihren Namen an." });
  }

  if (`${vorname} ${nachname}`.length > 120) {
    return jsonResponse(res, 400, { error: "Der Name ist zu lang." });
  }

  if (!email) {
    return jsonResponse(res, 400, { error: "Bitte geben Sie Ihre E-Mail-Adresse an." });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(res, 400, { error: "Bitte geben Sie eine gültige E-Mail-Adresse an." });
  }

  if (!an || !isValidDateString(an)) {
    return jsonResponse(res, 400, { error: "Bitte geben Sie ein gültiges Anreisedatum an." });
  }

  if (!ab || !isValidDateString(ab)) {
    return jsonResponse(res, 400, { error: "Bitte geben Sie ein gültiges Abreisedatum an." });
  }

  if (an >= ab) {
    return jsonResponse(res, 400, {
      error: "Das Abreisedatum muss nach dem Anreisedatum liegen.",
    });
  }

  const persRaw = data.pers;
  const persNum = Number(persRaw);
  if (
    persRaw === "" ||
    persRaw == null ||
    !Number.isInteger(persNum) ||
    String(persNum) !== String(persRaw).trim()
  ) {
    return jsonResponse(res, 400, { error: "Bitte wählen Sie die Gästezahl aus." });
  }

  if (persNum < 1 || persNum > 6) {
    return jsonResponse(res, 400, { error: "Die Gästezahl muss zwischen 1 und 6 liegen." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.BOOKING_NOTIFICATION_EMAIL;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey || !toEmail || !fromEmail) {
    console.error("Missing required environment variables for contact handler");
    return jsonResponse(res, 500, {
      error:
        "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut.",
    });
  }

  const requestedAt = new Date().toISOString();
  const { name, text, html } = buildEmailContent({
    vorname,
    nachname,
    email,
    tel,
    an,
    ab,
    pers: persNum,
    msg,
    requestedAt,
  });

  const subject = `Neue unverbindliche Buchungsanfrage von ${name}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `booking-${submissionId}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Resend request failed with status", response.status);
      return jsonResponse(res, 503, {
        error:
          "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut.",
      });
    }

    return jsonResponse(res, 200, { success: true });
  } catch {
    console.error("Resend request failed");
    return jsonResponse(res, 503, {
      error:
        "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut.",
    });
  }
};
