ScrollReveal().reveal('.efa-row-padding', {
    duration: 1000,
    distance: '50px',
    easing: 'ease-in-out',
    origin: 'bottom',
    interval: 200,
    reset:true,
  });

let currentPage = 1;
let totalPages = 1;
let renderPortfolioPage = null;

function setActivePage(page) {
  const buttons = document.querySelectorAll('#pagination .efa-bar-item');
  buttons.forEach(btn => btn.classList.remove('efa-black')); // remove active style

  // Update the active button
  const activeBtn = Array.from(buttons).find(btn => btn.dataset.page == page);
  if (activeBtn) activeBtn.classList.add('efa-black');

  currentPage = page;
}

// When user clicks a pagination button
function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  setActivePage(page);
  if (renderPortfolioPage) renderPortfolioPage(page);
}

// When user clicks previous or next
function changePage(direction) {
  const newPage = currentPage + direction;
  goToPage(newPage);
}


const CONTACT_API = "https://my-portofolio-j8da.onrender.com/api/contact";
const PIPELINE_STEPS = ["validate", "persist", "notify", "receipt"];
const PIPELINE_META = {
  validate: "Jakarta Bean Validation",
  persist: "PostgreSQL",
  notify: "Accepted event",
  receipt: "Ticket id"
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms) {
  if (prefersReducedMotion() || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bindContactPipeline() {
  const form = document.querySelector("#contact-form");
  const pipeline = document.querySelector("#contact-pipeline");
  const receipt = document.querySelector("#contact-receipt");
  const errorBox = document.querySelector("#contact-error");
  if (!form || !pipeline || !receipt) return;

  const submitButton = form.querySelector("button[type=submit]");
  const steps = PIPELINE_STEPS.map((name) => pipeline.querySelector(`[data-step="${name}"]`));

  function setError(message) {
    if (!errorBox) return;
    if (!message) {
      errorBox.textContent = "";
      errorBox.hidden = true;
      return;
    }
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function setReceipt(text) {
    receipt.textContent = text;
  }

  function resetSteps() {
    steps.forEach((step, index) => {
      if (!step) return;
      step.classList.remove("is-done", "is-current", "is-error");
      step.removeAttribute("aria-current");
      const meta = step.querySelector(".contact-pipeline-meta");
      if (meta) meta.textContent = PIPELINE_META[PIPELINE_STEPS[index]];
    });
  }

  function markStep(name, state, metaText) {
    const index = PIPELINE_STEPS.indexOf(name);
    const step = steps[index];
    if (!step) return;
    step.classList.remove("is-done", "is-current", "is-error");
    if (state) step.classList.add(state);
    if (state === "is-current") step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
    if (metaText) {
      const meta = step.querySelector(".contact-pipeline-meta");
      if (meta) meta.textContent = metaText;
    }
  }

  function clientTicket(data) {
    if (data && data.ticketId) return data.ticketId;
    if (data && data.id != null) return "msg_" + Number(data.id).toString(16);
    return "msg_received";
  }

  function stageDuration(data, name) {
    const stages = data && Array.isArray(data.stages) ? data.stages : [];
    const stage = stages.find((item) => item.name === name);
    return stage && typeof stage.durationMs === "number" ? stage.durationMs : null;
  }

  form.addEventListener("input", () => {
    if (errorBox && !errorBox.hidden) setError("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");
    resetSteps();
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");

    const payload = Object.fromEntries(new FormData(form));
    if (!payload.name.trim() || !payload.email.trim() || !payload.message.trim()) {
      markStep("validate", "is-error", "Required fields");
      setReceipt("Stopped at validate");
      setError("Name, email, and message are required.");
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
      return;
    }
    if (!form.email.checkValidity()) {
      markStep("validate", "is-error", "Invalid email");
      setReceipt("Stopped at validate");
      setError("Enter a valid email address.");
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
      return;
    }

    markStep("validate", "is-current", "Checking fields");
    setReceipt("Validate · checking fields");
    await wait(180);
    markStep("validate", "is-done", "Fields accepted");
    markStep("persist", "is-current", "Writing to PostgreSQL");
    setReceipt("Persist · POST /api/contact");

    const started = performance.now();
    try {
      const response = await fetch(CONTACT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000)
      });
      const elapsedMs = Math.round(performance.now() - started);
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const failed = data.stage === "validate" ? "validate" : "persist";
        if (failed === "validate") {
          markStep("validate", "is-error", "Rejected");
          markStep("persist", "", PIPELINE_META.persist);
        } else {
          markStep("persist", "is-error", "HTTP " + response.status);
        }
        setReceipt("Failed · HTTP " + response.status + " · " + elapsedMs + "ms");
        setError(data.error || "The Java service rejected this message. Try again.");
        return;
      }

      const persistMs = stageDuration(data, "persist");
      const notifyMs = stageDuration(data, "notify");
      const latency = typeof data.latencyMs === "number" ? data.latencyMs : elapsedMs;
      const store = data.store || "PostgreSQL";
      const ticket = clientTicket(data);

      markStep("persist", "is-done", persistMs != null ? persistMs + "ms" : "Saved");
      markStep("notify", "is-current", "Publishing accepted event");
      setReceipt("Notify · accepted event");
      await wait(160);
      markStep("notify", "is-done", notifyMs != null ? notifyMs + "ms" : "Accepted");
      markStep("receipt", "is-current", ticket);
      await wait(120);
      markStep("receipt", "is-done", ticket);
      setReceipt(ticket + " · " + store + " · " + latency + "ms · " + response.status + " Created");
      form.reset();
    } catch (error) {
      console.error(error);
      const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
      const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      markStep("persist", "is-error", timedOut ? "Timed out" : local ? "CORS" : "Network");
      if (timedOut) {
        setReceipt("Failed · Java service timed out");
        setError("The Java service did not respond in time. Try again in a moment.");
      } else if (local) {
        setReceipt("Failed · origin not allowed");
        setError("This local page is blocked by CORS. Push the site, then send from https://efatha.github.io/my-portofolio/ to get a receipt.");
      } else {
        setReceipt("Failed · persist did not complete");
        setError("Could not reach the Java service. Try again in a moment.");
      }
    } finally {
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindContactPipeline();

  // Collect the six project nodes (firstGrid's .efa-third and secondGrid's .efa-third)
  const items = Array.from(
    document.querySelectorAll(".efa-row-padding.firstGrid .efa-third, .efa-row-padding.secondGrid .efa-third")
  );

  // Transition duration (ms)
  const DURATION = 500;

  // Save original content so we can restore it later
  const original = items.map(el => {
    const img = el.querySelector("img");
    const titleEl = el.querySelector(".efa-container p b") || el.querySelector(".efa-container p"); // <p><b>...</b></p> or fallback
    const descEl  = (() => {
      const ps = el.querySelectorAll(".efa-container p");
      return ps[1] || ps[0]; // second <p> is description, fallback to first
    })();

    return {
      imgSrc: img ? img.getAttribute("src") : "",
      imgAlt: img ? img.getAttribute("alt") : "",
      link: el.querySelector("a") ? el.querySelector("a").getAttribute("href") : "",
      titleHTML: titleEl ? titleEl.innerHTML : "",
      descHTML: descEl ? descEl.innerHTML : ""
    };
  });

  const page2 = [
    { imgSrc: "image/efaculator1.png", imgAlt: "new1", titleHTML: "Efaculator", descHTML: "The Simple Calculator project delivers a user-friendly, web-based application for performing essential arithmetic operations, including addition, subtraction, multiplication, and division.", link: "https://efatha.github.io/Efaculator/" },
    { imgSrc: "image/EGT.png", imgAlt: "new2", titleHTML: "Goods Tracker", descHTML: "Track your goods and finances with clarity. EGT keeps your records accurate and accessible.", link: "https://efatha.github.io/Goodtracker/"  },
    { imgSrc: "image/HomeQuestEmailTemplate.png", imgAlt: "new3", titleHTML: "HomeQuest-Email-Template", descHTML: "Completed various freelance projects for clients, ranging from small business websites to custom web applications. Notably, I developed an 'Email Template HomeQuest' project, which involved creating a professional and user-friendly email design to enhance client communication. Each project involved close collaboration with clients to meet their specific needs.", link: "https://efatha.github.io/HomeQuest-Email-Template/"  },
    { imgSrc: "image/SmartNote.png", imgAlt: "new4", titleHTML: "MemoWise", descHTML: "Memo Wise is a modern, intuitive note-taking and reminder web application designed to help users capture ideas, organize thoughts, and manage tasks effectively. Developed using HTML, CSS, and JavaScript, the project features a clean and responsive interface that allows users to create, edit, delete, and categorize notes seamlessly.", link: "https://stirring-alfajores-d31cd2.netlify.app/" },
    { imgSrc: "image/study.png", imgAlt: "new5", titleHTML: "CommonBlog.com", descHTML: "CommonBlog is a community-driven platform designed to encourage meaningful conversations, idea sharing, and collaboration among people with common interests.", link: "https://real-time-multi-user.onrender.com" },
    { imgSrc: "image/freepik__make-a-book-design-on-which-its-written-efathas-di__99477.jpeg", imgAlt: "English Dictionary", titleHTML: "English Dictionary", descHTML: "This English Dictionary web application provides accurate definitions through a responsive, user-focused interface connected to a dictionary API. It demonstrates practical API integration, clear information design, and accessible web development.", link: "https://efatha.github.io/English-Dictionary-by-Efatha/" }
  ];

  const projectCatalog = [...original, ...page2];
  const pageSize = items.length;
  const projectPages = [];
  for (let index = 0; index < projectCatalog.length; index += pageSize) {
    projectPages.push(projectCatalog.slice(index, index + pageSize));
  }
  totalPages = projectPages.length;

  if (items.length !== 6) {
    console.warn("Expected 6 project items but found", items.length, ". Script will still try to operate on what exists.");
  }
  const pagination = document.querySelector("#pagination");
  if (pagination) {
    pagination.innerHTML = [
      { label: "«", page: "previous" },
      ...projectPages.map((_, index) => ({ label: String(index + 1), page: index + 1 })),
      { label: "»", page: "next" }
    ].map(({ label, page }) => `<a href="#portfolio" class="efa-bar-item efa-button efa-hover-black" data-page="${page}">${label}</a>`).join("");

    pagination.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link) return;
      event.preventDefault();
      if (link.dataset.page === "previous") changePage(-1);
      else if (link.dataset.page === "next") changePage(1);
      else goToPage(Number(link.dataset.page));
    });
  }

  // Set transitions for each item for smoother cross-fade
  items.forEach(el => {
    el.style.transition = `opacity ${DURATION}ms ease`;
    el.style.opacity = "1";
    // Ensure images scale well when swapping
    const img = el.querySelector("img");
    if (img) img.style.transition = `opacity ${DURATION}ms ease`;
  });

  // Helpers
  function fadeOutAll() {
    return new Promise(resolve => {
      // fade all items to 0
      items.forEach(el => el.style.opacity = "0");
      // also fade images inside (optional)
      setTimeout(resolve, DURATION);
    });
  }

  function fadeInAll() {
    return new Promise(resolve => {
      items.forEach(el => el.style.opacity = "1");
      setTimeout(resolve, DURATION);
    });
  }

  function applyDataToItems(dataArray) {
    items.forEach((el, idx) => {
      const data = dataArray[idx];
      if (!data) return; // skip if no data provided

      // Keep each card's image and destination in sync with its carousel page.
      const img = el.querySelector("img");
      const anchor = el.querySelector("a");
      if (anchor) anchor.setAttribute("href", data.link || "#");
      if (img) {
        // quick fade for image itself (keeps parent opacity animation smooth)
        img.style.opacity = "0";
        // after a short delay replace src then fade in
        setTimeout(() => {
          img.setAttribute("src", data.imgSrc);
          if (data.imgAlt) img.setAttribute("alt", data.imgAlt);
          img.style.opacity = "1";
        }, 100);
      }

      // Update title (first <p> <b> usually)
      const titleEl = el.querySelector(".efa-container p b") || el.querySelector(".efa-container p");
      if (titleEl) titleEl.innerHTML = data.titleHTML || "";

      // Update description (second <p>)
      const ps = el.querySelectorAll(".efa-container p");
      const descEl = ps[1] || ps[0];
      if (descEl) descEl.innerHTML = data.descHTML || "";

    });
  }

  async function renderPage(page) {
    await fadeOutAll();
    applyDataToItems(projectPages[page - 1]);
    await fadeInAll();
    setActivePage(page);
  }

  renderPortfolioPage = renderPage;
  applyDataToItems(projectPages[0]);
  setActivePage(1);

  // Optional: keyboard left/right support
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") {
      changePage(1);
    } else if (ev.key === "ArrowLeft") {
      changePage(-1);
    }
  });
});

// Handle the iframe scroll event to adjust height dynamically
document.addEventListener("DOMContentLoaded", function () {
    ScrollReveal().reveal('#radar-spiral', {
      delay: 100,
      duration: 1400,                    // Slightly extended duration for a graceful spiral twist
      opacity: 0,
      scale: 0.1,                        // Starts compact at the exact center of its container
      rotate: {
        x: 0,
        y: 0,
        z: -180                          // Unwinds a half-turn as it scales up
      },
      easing: 'cubic-bezier(0.25, 1, 0.3, 1)', // Snappy startup that slows down smoothly at the finish line
      viewFactor: 0.10,                  // Triggers precisely when 10% of the placeholder enters the viewport
      mobile: true,                      // Keeps the transition functional on handheld screens
      reset: false                       // Locks the animation in place once completed
    });
  });