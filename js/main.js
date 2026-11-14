(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuButton = document.getElementById("menu-toggle");
  const navigation = document.getElementById("primary-nav");
  const year = document.getElementById("current-year");
  const contactForm = document.getElementById("contact-form");

  if (year) year.textContent = String(new Date().getFullYear());

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "فتح القائمة");
    menuButton.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
      menuButton.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();

      const body = [
        "الاسم: " + name,
        "البريد الإلكتروني: " + email,
        "",
        "تفاصيل الرسالة:",
        message
      ].join("\n");

      const mailto = "mailto:fareskhamesfa5@gmail.com"
        + "?subject=" + encodeURIComponent(subject || "استفسار من الموقع")
        + "&body=" + encodeURIComponent(body);

      window.location.href = mailto;
      const hint = document.getElementById("form-hint");
      if (hint) hint.textContent = "تم تجهيز رسالتك. اضغط إرسال داخل تطبيق البريد لإتمام الإرسال.";
    });
  }
})();