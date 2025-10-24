ScrollReveal().reveal('.efa-row-padding', {
    duration: 1000,
    distance: '50px',
    easing: 'ease-in-out',
    origin: 'bottom',
    interval: 200,
    reset:true,
  });

let currentPage = 1;

function setActivePage(page) {
  const buttons = document.querySelectorAll('.efa-bar-item');
  buttons.forEach(btn => btn.classList.remove('efa-black')); // remove active style

  // Update the active button
  const activeBtn = Array.from(buttons).find(btn => btn.textContent.trim() == page);
  if (activeBtn) activeBtn.classList.add('efa-black');

  currentPage = page;
}

// When user clicks a pagination button
function goToPage(page) {
  if (page < 1 || page > 2) return; // only 2 pages for now
  setActivePage(page);
  // Here you can call your image update function if needed
}

// When user clicks previous or next
function changePage(direction) {
  const newPage = currentPage + direction;
  goToPage(newPage);
}


document.addEventListener("DOMContentLoaded", () => {
  // Collect the six project nodes (firstGrid's .efa-third and secondGrid's .efa-third)
  const firstGrid = document.querySelector(".efa-row-padding.firstGrid");
  const secondGrid = document.querySelector(".efa-row-padding.secondGrid");
  const items = Array.from(
    document.querySelectorAll(".efa-row-padding.firstGrid .efa-third, .efa-row-padding.secondGrid .efa-third")
  );

  // Find pagination buttons by their visible text
  const paginationLinks = Array.from(document.querySelectorAll(".efa-bar .efa-bar-item"));
  const btnPrev = paginationLinks.find(a => a.textContent.trim() === "«") || null;
  const btnOne  = paginationLinks.find(a => a.textContent.trim() === "1") || null;
  const btnTwo  = paginationLinks.find(a => a.textContent.trim() === "2") || null;

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
      titleHTML: titleEl ? titleEl.innerHTML : "",
      descHTML: descEl ? descEl.innerHTML : ""
    };
  });

  // Define the second set of data (placeholders). Replace these with your real links & text.
  // There must be exactly 6 objects here (one per item).
  const page2 = [
    { imgSrc: "image/efaculator1.png", imgAlt: "new1", titleHTML: "Efaculator", descHTML: "The Simple Calculator project delivers a user-friendly, web-based application for performing essential arithmetic operations, including addition, subtraction, multiplication, and division." },
    { imgSrc: "image/EGT.png", imgAlt: "new2", titleHTML: "Goods Tracker", descHTML: "Track your goods and finances with clarity. EGT keeps your records accurate and accessible." },
    { imgSrc: "image/HomeQuestEmailTemplate.png", imgAlt: "new3", titleHTML: "HomeQuest-Email-Template", descHTML: "Completed various freelance projects for clients, ranging from small business websites to custom web applications. Notably, I developed an 'Email Template HomeQuest' project, which involved creating a professional and user-friendly email design to enhance client communication. Each project involved close collaboration with clients to meet their specific needs." },
    { imgSrc: "image/SmartNote.png", imgAlt: "new4", titleHTML: "MemoWise", descHTML: "Memo Wise is a modern, intuitive note-taking and reminder web application designed to help users capture ideas, organize thoughts, and manage tasks effectively. Developed using HTML, CSS, and JavaScript, the project features a clean and responsive interface that allows users to create, edit, delete, and categorize notes seamlessly." },
    { imgSrc: "image/study.png", imgAlt: "new5", titleHTML: "Project E", descHTML: "Description for Project E." },
    { imgSrc: "image/book.png", imgAlt: "new6", titleHTML: "Project F", descHTML: "Description for Project F." }
  ];

  // Safety: ensure we have 6 items and 6 data objects
  if (items.length !== 6) {
    console.warn("Expected 6 project items but found", items.length, ". Script will still try to operate on what exists.");
  }
  if (page2.length < items.length) {
    console.warn("page2 array length is less than the number of items. Some items will be left unchanged.");
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

      // Update image
      const img = el.querySelector("img");
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

  // event handlers
  async function switchToPage2(e) {
    if (e) e.preventDefault();
    await fadeOutAll();
    applyDataToItems(page2);
    await fadeInAll();
    console.log("Updated all 6 items to page 2 data.");
  }

  async function restorePage1(e) {
    if (e) e.preventDefault();
    await fadeOutAll();
    applyDataToItems(original);
    await fadeInAll();
    console.log("Restored original 6 items.");
  }

  // Attach events if buttons exist
  if (btnTwo) btnTwo.addEventListener("click", switchToPage2);
  if (btnOne) btnOne.addEventListener("click", restorePage1);
  if (btnPrev) btnPrev.addEventListener("click", restorePage1);

  // Optional: keyboard left/right support
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") {
      if (btnTwo) switchToPage2();
    } else if (ev.key === "ArrowLeft") {
      restorePage1();
    }
  });
});

