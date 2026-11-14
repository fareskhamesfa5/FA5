(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const header = $(".header");
  const nav = $("#site-nav");
  const menuButton = $("#menu-toggle");
  const themeButton = $("#theme-toggle");
  const year = $("#year");
  const form = $("#contact-form");
  const backTop = $(".back-top");
  if (backTop) {
    backTop.addEventListener("click", event => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
  }



  // PWA: register offline support and expose the native install prompt when available.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(error => {
        console.warn("FA5 offline support could not be enabled:", error);
      });
    });
  }

  let deferredInstallPrompt = null;
  const installButton = $("#install-app");
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
    });
  }
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if (year) year.textContent = new Date().getFullYear();

  const closeMenu = () => {
    if (!nav || !menuButton) return;
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "فتح القائمة");
    menuButton.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(opened));
      menuButton.setAttribute("aria-label", opened ? "إغلاق القائمة" : "فتح القائمة");
      menuButton.innerHTML = opened
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });
    $$(".nav-link", nav).forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const applyTheme = theme => {
    document.body.classList.toggle("theme-light", theme === "light");
    if (themeButton) {
      const light = theme === "light";
      themeButton.innerHTML = light
        ? '<i class="fa-solid fa-moon" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
      themeButton.setAttribute("aria-label", light ? "تفعيل المظهر الداكن" : "تفعيل المظهر الفاتح");
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f8f8f4" : "#111311";
  };

  let savedTheme = "dark";
  try { savedTheme = localStorage.getItem("fa5-theme") || "dark"; } catch (_) {}
  applyTheme(savedTheme);

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const next = document.body.classList.contains("theme-light") ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("fa5-theme", next); } catch (_) {}
    });
  }

  const filterButtons = $$(".filter-button");
  const workCards = $$(".work-card");
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => item.classList.toggle("active", item === button));
      workCards.forEach(card => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });


  $$(".faq-item > button").forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const willOpen = !item.classList.contains("open");
      $$(".faq-item").forEach(other => {
        other.classList.remove("open");
        const trigger = $("button", other);
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  const sections = $$("main section[id]");
  const navLinks = $$(".nav-link");
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", active);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$(".section-top, .intro-grid, .principles article, .service-row, .work-card, .process-layout, .faq-item, .contact-form").forEach((element, index) => {
      element.classList.add("reveal");
      element.style.transitionDelay = (index % 4) * 55 + "ms";
      revealObserver.observe(element);
    });
  }


  const websiteCard = $(".website-card-locked");
  const countdownModal = $("#launch-countdown");
  const countdownFinished = $("[data-countdown-finished]");
  // موعد الإطلاق محسوب حسب توقيت القاهرة (مصر)، وليس توقيت جهاز الزائر.
  const cairoTimeZone = "Africa/Cairo";
  const cairoLaunchParts = { year: 2026, month: 12, day: 5, hour: 14, minute: 0, second: 0 };
  const getCairoOffset = date => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: cairoTimeZone, timeZoneName: "longOffset", hour: "2-digit"
    }).formatToParts(date);
    const offset = parts.find(part => part.type === "timeZoneName")?.value || "GMT+02:00";
    const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return 120;
    return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
  };
  const cairoLaunchWallTime = Date.UTC(
    cairoLaunchParts.year, cairoLaunchParts.month - 1, cairoLaunchParts.day,
    cairoLaunchParts.hour, cairoLaunchParts.minute, cairoLaunchParts.second
  );
  const launchDate = cairoLaunchWallTime - getCairoOffset(new Date(cairoLaunchWallTime)) * 60000;
  let countdownInterval = null;
  const countdownParts = {
    days: $("[data-countdown-days]"),
    hours: $("[data-countdown-hours]"),
    minutes: $("[data-countdown-minutes]"),
    seconds: $("[data-countdown-seconds]")
  };
  const unlockWebsite = () => {
    if (!websiteCard || websiteCard.dataset.unlocked === "true") return;
    websiteCard.dataset.unlocked = "true";
    websiteCard.classList.remove("website-card-locked");
    websiteCard.setAttribute("aria-label", "افتح موقع كشكول");
    const status = $(".website-locked", websiteCard);
    if (status) status.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> OPEN NOW';
    const description = $("p", websiteCard);
    if (description) description.textContent = "موقع كشكول أصبح متاحًا — اضغط للدخول.";
    const bottomText = $(".website-card-bottom span", websiteCard);
    if (bottomText) bottomText.textContent = "اضغط لفتح الموقع";
    const bottomIcon = $(".website-card-bottom i", websiteCard);
    if (bottomIcon) bottomIcon.className = "fa-solid fa-arrow-up-right-from-square";
  };
  // Trusted Cairo time; device clock changes cannot unlock the site early.
  let trustedEpochAtSync = null;
  let monotonicAtSync = null;
  const getTrustedNow = () => trustedEpochAtSync === null ? null : trustedEpochAtSync + performance.now() - monotonicAtSync;
  const updateCountdown = () => {
    const trustedNow = getTrustedNow();
    if (trustedNow === null) return;
    const remaining = Math.max(0, launchDate - trustedNow);
    const totalSeconds = Math.floor(remaining / 1000);
    const values = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
    Object.entries(countdownParts).forEach(([key, element]) => {
      if (element) element.textContent = String(values[key]).padStart(2, "0");
    });
    if (countdownFinished) countdownFinished.hidden = remaining > 0;
    if (remaining <= 0) unlockWebsite();
    if (remaining <= 0 && countdownInterval) {
      window.clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };
  const syncTrustedTime = async () => {
    try {
      // اقرأ ترويسة Date من خادم الموقع نفسه لتجنب مشاكل CORS لخدمات الوقت الخارجية.
      const syncUrl = new URL(window.location.href);
      syncUrl.searchParams.set("_time_sync", String(Math.floor(Math.random() * 1e9)));
      const response = await fetch(syncUrl.toString(), { method: "HEAD", cache: "no-store" });
      const serverDate = response.headers.get("Date");
      const serverEpoch = serverDate ? Date.parse(serverDate) : NaN;
      if (!response.ok || !Number.isFinite(serverEpoch)) throw new Error("Server time unavailable");
      trustedEpochAtSync = serverEpoch;
      monotonicAtSync = performance.now();
      updateCountdown();
    } catch (error) {
      if (countdownFinished) {
        countdownFinished.hidden = false;
        countdownFinished.textContent = "تعذر الاتصال بخادم التوقيت. تحقق من اتصال الإنترنت ثم أعد المحاولة.";
      }
    }
  };
  const closeCountdown = () => {
    if (!countdownModal) return;
    countdownModal.classList.remove("is-open");
    countdownModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("countdown-open");
    if (websiteCard) websiteCard.focus();
  };
  if (websiteCard && countdownModal) {
    websiteCard.addEventListener("click", () => {
      updateCountdown();
      if (getTrustedNow() !== null && getTrustedNow() >= launchDate) {
        window.location.href = "https://fareskhamesfa5.github.io/Kshkooll/";
        return;
      }
      countdownModal.classList.add("is-open");
      countdownModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("countdown-open");
      const closeButton = $(".countdown-close", countdownModal);
      if (closeButton) closeButton.focus();
      if (!countdownInterval) countdownInterval = window.setInterval(updateCountdown, 1000);
    });
    $$("[data-countdown-close]", countdownModal).forEach(button => {
      button.addEventListener("click", closeCountdown);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && countdownModal.classList.contains("is-open")) closeCountdown();
    });
    syncTrustedTime();
    window.setInterval(syncTrustedTime, 60000);
    updateCountdown();
    if (!countdownInterval) countdownInterval = window.setInterval(updateCountdown, 1000);
  }

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const service = String(data.get("service") || "").trim();
      const message = String(data.get("message") || "").trim();
      const subject = "استفسار مشروع جديد — " + service;
      const body = [
        "الاسم: " + name,
        "البريد الإلكتروني: " + email,
        "الخدمة المطلوبة: " + service,
        "",
        "تفاصيل الفكرة:",
        message
      ].join("\n");
      const url = "mailto:fareskhamesfa5@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      const note = $("#form-note");
      if (note) note.textContent = "تم تجهيز الرسالة. راجع التفاصيل واضغط إرسال من تطبيق البريد لإتمام التواصل.";
      window.location.href = url;
    });
  }
})();