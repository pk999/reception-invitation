(function () {
  const config = window.weddingConfig;
  const doc = document;

  if (!config) {
    return;
  }

  const selectors = {
    initials: "[data-initials]",
    coupleNames: "[data-couple-names]",
    dateLabel: "[data-date-label]",
    city: "[data-city]",
    venueName: "[data-venue-name]",
    venueAddress: "[data-venue-address]",
    rsvpDeadline: "[data-rsvp-deadline]"
  };

  function setText(selector, value) {
    doc.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDateForCalendar(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function renderStory() {
    const list = doc.querySelector("[data-story-list]");
    list.innerHTML = config.story
      .map(
        (item) => `
          <article class="story-card">
            <p class="eyebrow">${escapeHtml(item.kicker)}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `
      )
      .join("");
  }

  function renderEvents() {
    const list = doc.querySelector("[data-event-list]");
    list.innerHTML = config.events
      .map(
        (item) => `
          <article class="event-item">
            <div class="event-date">${escapeHtml(item.date)}</div>
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.place)}. ${escapeHtml(item.note)}</p>
            </div>
            <div class="event-time">${escapeHtml(item.time)}</div>
          </article>
        `
      )
      .join("");
  }

  function renderTravel() {
    const list = doc.querySelector("[data-travel-list]");
    list.innerHTML = config.travel
      .map(
        (item) => `
          <article class="travel-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `
      )
      .join("");
  }

  function renderGallery() {
    const list = doc.querySelector("[data-gallery-list]");
    list.innerHTML = config.gallery
      .map(
        (item) => `
          <figure class="gallery-card">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
            <span>${escapeHtml(item.title)}</span>
          </figure>
        `
      )
      .join("");
  }

  function updateCountdown() {
    const target = new Date(config.wedding.startDateTime).getTime();
    const distance = Math.max(target - Date.now(), 0);
    const day = 1000 * 60 * 60 * 24;
    const hour = 1000 * 60 * 60;
    const days = Math.floor(distance / day);
    const hours = Math.floor((distance % day) / hour);
    const minutes = Math.floor((distance % hour) / (1000 * 60));

    doc.querySelector("[data-count-days]").textContent = String(days).padStart(3, "0");
    doc.querySelector("[data-count-hours]").textContent = String(hours).padStart(2, "0");
    doc.querySelector("[data-count-minutes]").textContent = String(minutes).padStart(2, "0");
  }

  function setupCalendar() {
    const start = new Date(config.wedding.startDateTime);
    const end = new Date(config.wedding.endDateTime);
    const title = `${config.couple.displayNames} Reception Dinner`;
    const details = `Reception dinner for ${config.couple.displayNames}`;
    const location = `${config.wedding.venueName}, ${config.wedding.venueAddress}`;
    const googleUrl = new URL("https://calendar.google.com/calendar/render");

    googleUrl.searchParams.set("action", "TEMPLATE");
    googleUrl.searchParams.set("text", title);
    googleUrl.searchParams.set("dates", `${formatDateForCalendar(start)}/${formatDateForCalendar(end)}`);
    googleUrl.searchParams.set("details", details);
    googleUrl.searchParams.set("location", location);
    doc.querySelector("[data-google-calendar]").href = googleUrl.toString();

    doc.querySelector("[data-download-ics]").addEventListener("click", () => {
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Reception Dinner Invitation//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@wedding-invitation.local`,
        `DTSTAMP:${formatDateForCalendar(new Date())}`,
        `DTSTART:${formatDateForCalendar(start)}`,
        `DTEND:${formatDateForCalendar(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${details}`,
        `LOCATION:${location}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const link = doc.createElement("a");
      const url = URL.createObjectURL(blob);
      const baseName = `${config.couple.personOne}-${config.couple.personTwo}-reception-dinner`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.href = url;
      link.download = `${baseName}.ics`;
      doc.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  function setupNav() {
    const header = doc.querySelector("[data-header]");
    const nav = doc.querySelector("[data-nav]");
    const toggle = doc.querySelector("[data-nav-toggle]");

    function syncHeader() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      header.classList.toggle("is-open", isOpen);
      doc.body.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        header.classList.remove("is-open");
        doc.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
  }

  async function submitToEndpoint(payload) {
    if (!config.invite.formEndpoint) {
      return { storedOnly: true };
    }

    const response = await fetch(config.invite.formEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return { response };
  }

  function setupRsvp() {
    const form = doc.querySelector("[data-rsvp-form]");
    const status = doc.querySelector("[data-form-status]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.classList.remove("is-error");
      status.textContent = "";

      const data = new FormData(form);
      const code = String(data.get("code") || "").trim().toUpperCase();
      const allowedCodes = config.invite.inviteCodes.map((item) => item.toUpperCase());

      if (allowedCodes.length && !allowedCodes.includes(code)) {
        status.classList.add("is-error");
        status.textContent = "That invite code does not match our list.";
        return;
      }

      const payload = {
        name: data.get("name"),
        code,
        email: data.get("email"),
        attending: data.get("attending"),
        guests: data.get("guests"),
        message: data.get("message"),
        submittedAt: new Date().toISOString()
      };

      try {
        await submitToEndpoint(payload);
        localStorage.setItem("wedding-rsvp", JSON.stringify(payload));
        status.textContent = config.invite.formEndpoint
          ? "Thank you. Your RSVP has been sent."
          : "Thank you. Your RSVP is saved in this browser.";
        form.reset();
      } catch (error) {
        status.classList.add("is-error");
        status.textContent = `Please email your RSVP to ${config.invite.contactEmail}.`;
      }
    });
  }

  function init() {
    doc.documentElement.style.setProperty("--hero-image", `url("${config.hero.image}")`);
    doc.title = `${config.couple.displayNames} Reception Dinner`;

    setText(selectors.initials, config.couple.initials);
    setText(selectors.coupleNames, config.couple.displayNames);
    setText(selectors.dateLabel, config.wedding.dateLabel);
    setText(selectors.city, config.wedding.city);
    setText(selectors.venueName, config.wedding.venueName);
    setText(selectors.venueAddress, config.wedding.venueAddress);
    setText(selectors.rsvpDeadline, config.invite.rsvpDeadline);

    doc.querySelector("[data-map-link]").href = config.wedding.mapUrl;

    renderStory();
    renderEvents();
    renderTravel();
    renderGallery();
    setupNav();
    setupCalendar();
    setupRsvp();
    updateCountdown();
    setInterval(updateCountdown, 60000);
  }

  init();
})();
