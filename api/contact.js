const rateLimit = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 204, {});
  }

  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return json(res, 429, { ok: false, error: "Too many requests. Please try again later." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "info@hola-diamond.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.error("Missing RESEND_API_KEY or CONTACT_FROM_EMAIL");
    return json(res, 503, { ok: false, error: "Service temporarily unavailable." });
  }

  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { ok: false, error: "Invalid request." });
  }

  const { vorname, nachname, email, tel, an, ab, pers, msg, website } = data;

  if (website) {
    return json(res, 400, { ok: false, error: "Invalid request." });
  }

  if (!vorname?.trim() || !nachname?.trim() || !email?.trim() || !an || !ab || !pers) {
    return json(res, 400, { ok: false, error: "Please fill in all required fields." });
  }

  if (!isValidEmail(email.trim())) {
    return json(res, 400, { ok: false, error: "Please enter a valid email address." });
  }

  if (ab <= an) {
    return json(res, 400, { ok: false, error: "Check-out must be after check-in." });
  }

  const subject = `Buchungsanfrage Main Panorama Suite – ${an} bis ${ab}`;
  const text = [
    "Neue Buchungsanfrage über mainblick-suite.de",
    "",
    `Name: ${vorname.trim()} ${nachname.trim()}`,
    `E-Mail: ${email.trim()}`,
    `Telefon: ${tel?.trim() || "–"}`,
    `Anreise: ${an}`,
    `Abreise: ${ab}`,
    `Personen: ${pers}`,
    "",
    "Nachricht:",
    msg?.trim() || "–",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email.trim(),
        subject,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Resend error:", response.status, await response.text());
      return json(res, 502, { ok: false, error: "Could not send enquiry. Please try again or call us." });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    console.error("Resend fetch failed:", err);
    return json(res, 502, { ok: false, error: "Could not send enquiry. Please try again or call us." });
  }
};
