var lang = "de";

var lbImages = [
  "images/hero.avif",
  "images/thumbs/essen.avif",
  "images/thumbs/schlafzimmer.avif",
  "images/thumbs/bad.avif",
  "images/thumbs/kueche.avif",
  "images/about.avif",
  "images/cards/wohnen.avif",
  "images/cards/kueche.avif",
  "images/cards/bad.avif",
  "images/cards/schlaf.avif",
];
var lbAlts = [
  "Freudenburg und Main bei Freudenberg am Main",
  "Essbereich mit Mainblick",
  "Schlafzimmer",
  "Badezimmer",
  "Küche",
  "Wohnzimmer Main Panorama Suite mit Mainblick Freudenberg",
  "Wohnzimmer mit TV und Designer-Beleuchtung",
  "Vollausgestattete Küche mit Airfryer und Nespresso",
  "Luxusbadezimmer mit Marmor und Walk-in Dusche",
  "Schlafzimmer mit Queensize-Bett und TV",
];
var lbIdx = 0;

var MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2605.392402023433!2d9.3217954!3d49.7410586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a2ac969da74831%3A0x17034ca2a2e4ed7b!2sHauptstra%C3%9Fe+97%2C+97896+Freudenberg!5e0!3m2!1sde!2sde!4v1750000000";
var MAP_CONSENT_KEY = "maps-consent";

var faq = {
  de: [
    { q: "Wann sind Check-in und Check-out?", a: "Check-in ist ab 14:00 Uhr möglich, Check-out bis 11:00 Uhr. Kontaktloser Check-in ist auf Wunsch möglich – Schlüsselübergabe flexibel nach Absprache." },
    { q: "Gibt es kostenlose Parkplätze?", a: "Ja, kostenfreie Parkplätze direkt an der Mainpromenade sind inklusive – kein Parkplatzsuchen, kein Stress." },
    { q: "Für wie viele Personen ist die Suite geeignet?", a: "Die Suite bietet Platz für bis zu 4 Personen: 2 im Queensize-Bett im Schlafzimmer und 2 weitere auf dem Schlafsofa im Wohnbereich." },
    { q: "Sind Haustiere erlaubt?", a: "Leider sind Haustiere in der Main Panorama Suite nicht gestattet." },
    { q: "Ist Rauchen in der Unterkunft erlaubt?", a: "Nein, die gesamte Unterkunft ist rauchfrei. Wir bitten darum, dies zu respektieren." },
    { q: "Gibt es einen Mindeststay?", a: "Nein, Kurzaufenthalte ab 1 Nacht sind herzlich willkommen. Auch für Homeoffice-Wochen oder längere Aufenthalte sind wir gern Ihr Zuhause." },
    { q: "Kann ich auch direkt buchen (ohne Booking.com)?", a: "Ja! Nutzen Sie unser Anfrageformular oder rufen Sie uns direkt an. Direktbuchungen sind ausdrücklich möglich und willkommen." },
    { q: "Welche Streaming-Dienste sind verfügbar?", a: "Netflix und weitere Streaming-Dienste stehen bereit. Highspeed-WLAN ist kostenlos im gesamten Apartment verfügbar." },
    { q: "Ist die Suite für Geschäftsreisende geeignet?", a: "Absolut. Highspeed-WLAN, schallisolierte Räume, flexibler Check-in und kostenloser Parkplatz machen die Suite zur idealen Geschäftsunterkunft." },
  ],
  en: [
    { q: "What are the check-in and check-out times?", a: "Check-in is from 2:00 PM, check-out by 11:00 AM. Contactless check-in is available on request." },
    { q: "Is parking available?", a: "Yes, free parking is included right at the Main promenade – no searching, no stress." },
    { q: "How many guests can stay?", a: "The suite sleeps up to 4 guests: 2 in the queen-size bed and 2 more on the sofa bed in the living area." },
    { q: "Are pets allowed?", a: "Unfortunately, pets are not permitted at the Main Panorama Suite." },
    { q: "Is smoking permitted?", a: "No, the entire apartment is smoke-free. We kindly ask guests to respect this." },
    { q: "Is there a minimum stay?", a: "No, short stays from 1 night are very welcome. We also love hosting longer stays." },
    { q: "Can I book directly (without Booking.com)?", a: "Yes! Use our enquiry form or call us directly. Direct bookings are very welcome." },
    { q: "Which streaming services are available?", a: "Netflix and other streaming services are available. High-speed WiFi is free throughout the apartment." },
    { q: "Is the suite suitable for business travellers?", a: "Absolutely. High-speed WiFi, sound-insulated rooms, flexible check-in and free parking make it ideal for business stays." },
  ],
};

function openLB(i) {
  lbIdx = i;
  var img = document.getElementById("lb-img");
  img.src = lbImages[i];
  img.alt = lbAlts[i];
  document.getElementById("lb").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLB() {
  document.getElementById("lb").classList.remove("open");
  if (!document.body.classList.contains("nav-open") && !document.querySelector(".aus-modal-bg.open")) {
    document.body.style.overflow = "";
  }
}

function lbNav(d) {
  lbIdx = (lbIdx + d + lbImages.length) % lbImages.length;
  var img = document.getElementById("lb-img");
  img.src = lbImages[lbIdx];
  img.alt = lbAlts[lbIdx];
}

function buildFAQ(l) {
  var el = document.getElementById("faq-list");
  el.innerHTML = "";
  faq[l].forEach(function (item) {
    var d = document.createElement("div");
    d.className = "fi";
    var fq = document.createElement("div");
    fq.className = "fq";
    fq.setAttribute("role", "button");
    fq.setAttribute("tabindex", "0");
    var qSpan = document.createElement("span");
    qSpan.textContent = item.q;
    var tog = document.createElement("span");
    tog.className = "ftog";
    tog.textContent = "+";
    fq.appendChild(qSpan);
    fq.appendChild(tog);
    var fa = document.createElement("div");
    fa.className = "fa";
    var p = document.createElement("p");
    p.textContent = item.a;
    fa.appendChild(p);
    d.appendChild(fq);
    d.appendChild(fa);
    el.appendChild(d);
  });
}

function tFAQ(el) {
  var i = el.closest(".fi");
  var w = i.classList.contains("open");
  document.querySelectorAll(".fi.open").forEach(function (x) {
    x.classList.remove("open");
  });
  if (!w) i.classList.add("open");
}

function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll("[data-" + l + "]").forEach(function (el) {
    el.innerHTML = el.getAttribute("data-" + l);
  });
  document.querySelectorAll("[data-ph-de]").forEach(function (el) {
    el.placeholder = l === "de" ? el.getAttribute("data-ph-de") : el.getAttribute("data-ph-en");
  });
  document.getElementById("btn-de").classList.toggle("on", l === "de");
  document.getElementById("btn-en").classList.toggle("on", l === "en");
  buildFAQ(l);
  var s = document.getElementById("f-pers");
  if (s) {
    var o =
      l === "de"
        ? ["Bitte wählen …", "1 Person", "2 Personen", "3 Personen", "4 Personen", "5 Personen", "6 Personen"]
        : ["Please select …", "1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests"];
    for (var i = 0; i < s.options.length; i++) s.options[i].text = o[i];
  }
  var ok = document.getElementById("fsuccess");
  if (ok && ok.style.display !== "block") {
    ok.textContent =
      l === "de"
        ? "✓ Vielen Dank. Ihre unverbindliche Anfrage wurde versendet."
        : "✓ Thank you. Your non-binding enquiry has been sent.";
  }
  var err = document.getElementById("ferror");
  if (err && err.style.display === "block") {
    err.textContent =
      l === "de"
        ? "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per E-Mail."
        : "Your enquiry could not be sent right now. Please try again later or contact us by email.";
  }
  var btn = document.getElementById("sbtn");
  if (btn && !btn.disabled) {
    var span = btn.querySelector("span");
    if (span) span.textContent = l === "de" ? "Anfrage senden" : "Send Enquiry";
  }
}

function scroll2(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function setFormMessage(type, message) {
  var ok = document.getElementById("fsuccess");
  var err = document.getElementById("ferror");
  ok.style.display = type === "success" ? "block" : "none";
  err.style.display = type === "error" ? "block" : "none";
  if (type === "success") ok.textContent = message;
  if (type === "error") err.textContent = message;
}

function initFormLoadedAt() {
  var el = document.getElementById("f-loaded-at");
  if (el) el.value = String(Date.now());
}

function sendForm(e) {
  e.preventDefault();
  var form = document.getElementById("iform");
  var btn = document.getElementById("sbtn");
  var btnSpan = btn.querySelector("span");
  var originalLabel = btnSpan ? btnSpan.textContent : "";
  var submissionId = crypto.randomUUID();

  btn.disabled = true;
  if (btnSpan) btnSpan.textContent = lang === "de" ? "Wird gesendet …" : "Sending …";
  setFormMessage("none", "");

  var d = new FormData(form);
  var payload = {
    vorname: d.get("vorname"),
    nachname: d.get("nachname"),
    email: d.get("email"),
    tel: d.get("tel"),
    an: d.get("an"),
    ab: d.get("ab"),
    pers: d.get("pers"),
    msg: d.get("msg"),
    website: d.get("website"),
    formLoadedAt: Number(d.get("formLoadedAt")),
    submissionId: submissionId,
  };

  var successMsg =
    lang === "de"
      ? "✓ Vielen Dank. Ihre unverbindliche Anfrage wurde versendet."
      : "✓ Thank you. Your non-binding enquiry has been sent.";
  var errorMsg =
    lang === "de"
      ? "Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per E-Mail."
      : "Your enquiry could not be sent right now. Please try again later or contact us by email.";

  fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (body) {
          return { ok: res.ok, body: body };
        });
    })
    .then(function (result) {
      if (result.ok && result.body.success) {
        setFormMessage("success", successMsg);
        form.reset();
        initDateFields();
        initFormLoadedAt();
      } else {
        setFormMessage("error", errorMsg);
      }
    })
    .catch(function () {
      setFormMessage("error", errorMsg);
    })
    .finally(function () {
      btn.disabled = false;
      if (btnSpan) btnSpan.textContent = originalLabel;
    });
}

function initDateFields() {
  var t = new Date().toISOString().split("T")[0];
  var an = document.getElementById("f-an");
  var ab = document.getElementById("f-ab");
  if (!an || !ab) return;
  an.min = t;
  ab.min = t;
}

function openAusModal(id) {
  var m = document.getElementById(id);
  if (!m) return;
  m.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAusModalById(id) {
  var m = document.getElementById(id);
  if (m) m.classList.remove("open");
  if (!document.getElementById("lb").classList.contains("open") && !document.body.classList.contains("nav-open")) {
    document.body.style.overflow = "";
  }
}

function closeAllAusModals() {
  document.querySelectorAll(".aus-modal-bg.open").forEach(function (m) {
    m.classList.remove("open");
  });
  if (!document.getElementById("lb").classList.contains("open") && !document.body.classList.contains("nav-open")) {
    document.body.style.overflow = "";
  }
}

function closeNav() {
  var nav = document.getElementById("mobile-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (!nav) return;
  nav.classList.remove("open");
  nav.setAttribute("aria-hidden", "true");
  document.body.classList.remove("nav-open");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", lang === "de" ? "Menü öffnen" : "Open menu");
  }
  if (!document.getElementById("lb").classList.contains("open") && !document.querySelector(".aus-modal-bg.open")) {
    document.body.style.overflow = "";
  }
}

function openNav() {
  var nav = document.getElementById("mobile-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (!nav) return;
  nav.classList.add("open");
  nav.setAttribute("aria-hidden", "false");
  document.body.classList.add("nav-open");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", lang === "de" ? "Menü schließen" : "Close menu");
  }
  document.body.style.overflow = "hidden";
}

function toggleNav() {
  var nav = document.getElementById("mobile-nav");
  if (nav && nav.classList.contains("open")) closeNav();
  else openNav();
}

function loadMap() {
  var iframe = document.getElementById("map-iframe");
  var consent = document.getElementById("map-consent");
  if (!iframe || !consent || iframe.getAttribute("src")) return;
  consent.classList.add("hidden");
  iframe.classList.add("loaded");
  iframe.src = MAP_SRC;
  try {
    localStorage.setItem(MAP_CONSENT_KEY, "1");
  } catch (e) {}
}

function initMap() {
  var iframe = document.getElementById("map-iframe");
  var consent = document.getElementById("map-consent");
  if (!iframe || !consent) return;
  var hasConsent = false;
  try {
    hasConsent = localStorage.getItem(MAP_CONSENT_KEY) === "1";
  } catch (e) {}
  if (hasConsent) loadMap();
}

function bindEvents() {
  document.getElementById("btn-de").addEventListener("click", function () {
    setLang("de");
  });
  document.getElementById("btn-en").addEventListener("click", function () {
    setLang("en");
  });

  document.querySelectorAll("[data-scroll]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      closeNav();
      scroll2(el.getAttribute("data-scroll"));
    });
  });

  var navToggle = document.querySelector(".nav-toggle");
  if (navToggle) navToggle.addEventListener("click", toggleNav);

  var mobileNav = document.getElementById("mobile-nav");
  if (mobileNav) {
    mobileNav.addEventListener("click", function (e) {
      if (e.target === mobileNav) closeNav();
    });
  }

  var hero = document.getElementById("hero");
  if (hero) {
    hero.addEventListener("click", function (e) {
      if (e.target.closest("a, button, .thumbstrip")) return;
      openLB(0);
    });
  }

  document.querySelectorAll("[data-lb]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      openLB(parseInt(el.getAttribute("data-lb"), 10));
    });
  });

  var lb = document.getElementById("lb");
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeLB();
  });
  document.querySelector(".lb-close").addEventListener("click", closeLB);
  document.querySelector(".lb-prev").addEventListener("click", function (e) {
    e.stopPropagation();
    lbNav(-1);
  });
  document.querySelector(".lb-next").addEventListener("click", function (e) {
    e.stopPropagation();
    lbNav(1);
  });

  document.querySelectorAll("[data-modal]").forEach(function (el) {
    el.addEventListener("click", function () {
      openAusModal(el.getAttribute("data-modal"));
    });
  });

  document.querySelectorAll(".aus-modal-bg").forEach(function (bg) {
    bg.addEventListener("click", function (e) {
      if (e.target === bg) {
        bg.classList.remove("open");
        if (!document.getElementById("lb").classList.contains("open") && !document.body.classList.contains("nav-open")) {
          document.body.style.overflow = "";
        }
      }
    });
  });

  document.querySelectorAll(".aus-modal-close").forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeAusModalById(btn.getAttribute("data-modal"));
    });
  });

  document.getElementById("faq-list").addEventListener("click", function (e) {
    var fq = e.target.closest(".fq");
    if (fq) tFAQ(fq);
  });
  document.getElementById("faq-list").addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      var fq = e.target.closest(".fq");
      if (fq) {
        e.preventDefault();
        tFAQ(fq);
      }
    }
  });

  document.getElementById("iform").addEventListener("submit", sendForm);

  var mapBtn = document.getElementById("map-load-btn");
  if (mapBtn) mapBtn.addEventListener("click", loadMap);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeNav();
      closeLB();
      closeAllAusModals();
    }
    if (e.key === "ArrowLeft" && document.getElementById("lb").classList.contains("open")) lbNav(-1);
    if (e.key === "ArrowRight" && document.getElementById("lb").classList.contains("open")) lbNav(1);
  });

  var nav = document.querySelector("nav");
  if (nav) {
    window.addEventListener(
      "scroll",
      function () {
        nav.classList.toggle("scrolled", window.scrollY > 10);
      },
      { passive: true }
    );
  }

  var an = document.getElementById("f-an");
  var ab = document.getElementById("f-ab");
  if (an && ab) {
    an.addEventListener("change", function () {
      ab.min = an.value;
      if (ab.value && ab.value <= an.value) ab.value = "";
    });
  }
}

function initFactsMarquee() {
  if (window.innerWidth > 900) return;
  var wrap = document.querySelector(".facts-wrap");
  if (!wrap) return;
  var pills = Array.from(wrap.querySelectorAll(".pill"));
  pills.forEach(function (pill) {
    var clone = pill.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    wrap.appendChild(clone);
  });
  wrap.classList.add("marquee");
}

buildFAQ("de");
initDateFields();
initFormLoadedAt();
initMap();
bindEvents();
initFactsMarquee();
