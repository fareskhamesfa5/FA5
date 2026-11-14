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


  // Websites pagination: show two cards per page.
  const websiteGrid = document.querySelector("#websites-grid");
  if (websiteGrid) {
    const websiteCards = Array.from(websiteGrid.querySelectorAll("[data-website-card]"));
    const pagination = document.querySelector(".websites-pagination");
    const pageButtons = pagination ? Array.from(pagination.querySelectorAll("[data-page]")) : [];
    const prevPage = document.querySelector("[data-page-prev]");
    const nextPage = document.querySelector("[data-page-next]");
    const pageStatus = document.querySelector("#websites-page-status");
    const pageSize = 2;
    const pageCount = Math.ceil(websiteCards.length / pageSize);
    let currentPage = 1;

    const showWebsitePage = page => {
      if (!pageCount) return;
      currentPage = Math.max(1, Math.min(pageCount, page));
      const first = (currentPage - 1) * pageSize;

      websiteCards.forEach((card, index) => {
        card.hidden = index < first || index >= first + pageSize;
      });

      pageButtons.forEach(button => {
        const active = Number(button.dataset.page) === currentPage;
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });

      if (prevPage) prevPage.disabled = currentPage === 1;
      if (nextPage) nextPage.disabled = currentPage === pageCount;

      if (pageStatus) {
        const last = Math.min(first + pageSize, websiteCards.length);
        pageStatus.textContent = "عرض " + (first + 1) + "–" + last + " من " + websiteCards.length + " مواقع";
      }
    };

    pageButtons.forEach(button => {
      button.addEventListener("click", () => showWebsitePage(Number(button.dataset.page)));
    });
    if (prevPage) prevPage.addEventListener("click", () => showWebsitePage(currentPage - 1));
    if (nextPage) nextPage.addEventListener("click", () => showWebsitePage(currentPage + 1));
    showWebsitePage(1);
  }

  $(".faq-item > button").forEach(button => {
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