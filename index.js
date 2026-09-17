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


document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = contactForm.querySelector("button[type=submit]");
      submitButton.disabled = true;

      try {
        const response = await fetch("https://my-portofolio-j8da.onrender.com/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        contactForm.reset();
        alert("Your message was sent successfully.");
      } catch (error) {
        console.error(error);
        alert("We could not send your message. Please try again later.");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

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