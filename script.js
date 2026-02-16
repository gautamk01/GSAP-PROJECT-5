import gsap from "gsap";
import SplitText from "gsap/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(SplitText, ScrollTrigger);

// === LENIS SMOOTH SCROLL ===
const lenis = new Lenis({
  lerp: 0.1,
  smoothWheel: true,
  syncTouch: true,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

document.fonts.ready.then(() => {
  // Check if user has already seen preloader in this session
  const hasSeenPreloader = sessionStorage.getItem("preloaderShown");

  if (hasSeenPreloader) {
    // Skip preloader - immediately show content
    gsap.set(".preloader-progress, .preloader-mask, .preloader-content", {
      display: "none",
      autoAlpha: 0,
    });
    gsap.set("nav, main, section, footer", { autoAlpha: 1 });

    // Continue to page animations below
  } else {
    // Mark preloader as shown for this session
    sessionStorage.setItem("preloaderShown", "true");
    // Preloader will run below
  }

  function createSplitTexts(elements) {
    const split = {};

    elements.forEach(({ key, selector, type }) => {
      if (document.querySelector(selector)) {
        const config = { type, mask: type };
        if (type === "chars") config.charsClass = "char";
        if (type === "lines") config.linesClass = "line";
        split[key] = SplitText.create(selector, config);
      }
    });
    return split;
  }

  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  // t1 is always defined so content reveal code can reference it
  let t1;

  if (!hasSeenPreloader) {
    // === FIRST VISIT: Full preloader animation ===
    // Preloader splits (always needed, viewport-independent)
    const preloaderSplits = [
      { key: "logoChars", selector: ".preloader-logo h1", type: "chars" },
      { key: "footerLine", selector: ".preloader-footer p", type: "lines" },
    ];

    const split = createSplitTexts(preloaderSplits);

    // Set preloader initial states
    if (split.footerLine) gsap.set(split.footerLine.words, { y: "100%" });

    // Hide page content during preloader (nav, main, footer)
    // NOTE: Do NOT include #mobile-nav here — it uses CSS class toggle
    gsap.set("nav, main, section, footer", { autoAlpha: 0 });

    function animateProgress(duration = 4) {
      const tl = gsap.timeline();
      const counterSteps = 5;
      let currentProgress = 0;

      for (let i = 0; i < counterSteps; i++) {
        const finalStep = i === counterSteps - 1;
        const targetProgress = finalStep
          ? 1
          : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9);
        currentProgress = targetProgress;
        tl.to(".preloader-progress-bar", {
          scaleX: targetProgress,
          duration: duration / counterSteps,
          ease: "power2.out",
        });
      }
      return tl;
    }

    // === PRELOADER TIMELINE (universal — same on all viewports) ===
    t1 = gsap.timeline({ delay: 0.5 });

    if (split.logoChars) {
      t1.to(split.logoChars.chars, {
        x: "0%",
        stagger: 0.05,
        duration: 1,
        ease: "power4.inOut",
      });
    }

    if (split.footerLine) {
      t1.to(
        split.footerLine.lines,
        { y: "0%", stagger: 0.1, duration: 1, ease: "power4.inOut" },
        "0.25",
      );
    }

    t1.add(animateProgress(), "<").set(".preloader-progress", {
      backgroundColor: "#f5f5f5",
    });

    if (split.logoChars) {
      t1.to(
        split.logoChars.chars,
        { x: "-100%", stagger: 0.05, duration: 1, ease: "power4.inOut" },
        "-=0.5",
      );
    }

    if (split.footerLine) {
      t1.to(
        split.footerLine.lines,
        { y: "-100%", stagger: 0.1, duration: 1, ease: "power4.inOut" },
        "<",
      );
    }

    // === PRELOADER EXIT ===
    if (isMobile) {
      // Mobile: smooth crossfade — no jarring mask scale
      t1.to(
        ".preloader-progress",
        { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" },
        "-=0.25",
      )
        .to(
          ".preloader-mask",
          { autoAlpha: 0, duration: 0.8, ease: "power2.inOut" },
          "<",
        )
        .to(
          ".preloader-content",
          { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
          "<",
        )
        .set(".preloader-progress, .preloader-mask, .preloader-content", {
          display: "none",
        });
    } else {
      // Desktop: original mask scale reveal (looks great on large screens)
      t1.to(
        ".preloader-progress",
        { opacity: 0, duration: 0.5, ease: "power3.out" },
        "-=0.25",
      )
        .to(
          ".preloader-mask",
          { scale: 5, duration: 2.5, ease: "power3.out" },
          "<",
        )
        .set(".preloader-progress, .preloader-mask, .preloader-content", {
          autoAlpha: 0,
          display: "none",
        });
    }

    // Nav fades in
    t1.to(
      "nav",
      { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
      isMobile ? "-=0.3" : "-=1.5",
    );
  } else {
    // === RETURN VISIT: Skip preloader, instant content ===
    t1 = gsap.timeline(); // empty timeline for content reveal to chain onto
  }

  // === CONTENT REVEAL (viewport-aware via matchMedia) ===
  gsap.matchMedia().add(
    {
      isDesktop: "(min-width: 768px)",
      isMobile: "(max-width: 767px)",
    },
    (context) => {
      const { isDesktop } = context.conditions;

      // Re-create SplitText inside matchMedia so it splits based on current layout
      const contentSplits = [
        { key: "headlineChars", selector: "main h2", type: "chars" },
        { key: "subtextLines", selector: "main p", type: "lines" },
      ];
      const contentSplit = createSplitTexts(contentSplits);

      if (!hasSeenPreloader) {
        // === FIRST VISIT: Sequenced reveal after preloader ===
        // Set initial states (hidden)
        if (contentSplit.headlineChars)
          gsap.set(contentSplit.headlineChars.chars, { y: "100%" });
        if (contentSplit.subtextLines)
          gsap.set(contentSplit.subtextLines.lines, { y: "100%" });
        gsap.set(".scatter-img", { scale: 0, opacity: 0 });
        gsap.set(".btn-oval", { scale: 0, opacity: 0 });

        // Show main + footer + sections containers
        t1.to(
          "main, section, footer",
          { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
          isDesktop ? "-=1.5" : "-=0.2",
        );

        // Scatter images reveal
        t1.to(
          ".scatter-img",
          {
            scale: 1,
            opacity: isDesktop ? 1 : 0.3,
            duration: isDesktop ? 1.5 : 1,
            ease: "power3.out",
            stagger: isDesktop ? 0.2 : 0.1,
          },
          isDesktop ? "-=1.5" : "-=0.3",
        );

        // Headline chars reveal
        if (contentSplit.headlineChars) {
          t1.to(
            contentSplit.headlineChars.chars,
            {
              y: 0,
              stagger: isDesktop ? 0.03 : 0.02,
              duration: isDesktop ? 1 : 0.8,
              ease: "power4.out",
            },
            isDesktop ? "-=1.0" : "-=0.6",
          );
        }

        // Subtext lines reveal
        if (contentSplit.subtextLines) {
          t1.to(
            contentSplit.subtextLines.lines,
            {
              y: 0,
              stagger: 0.1,
              duration: isDesktop ? 1 : 0.8,
              ease: "power4.out",
            },
            "-=0.8",
          );
        }

        // Button reveal
        t1.to(
          ".btn-oval",
          {
            scale: 1,
            opacity: 1,
            duration: isDesktop ? 1 : 0.8,
            ease: "power4.out",
          },
          "-=0.8",
        );
      }
      // RETURN VISIT: No hidden states set, no timeline animations needed
      // Content is already visible via the initial gsap.set at the top

      // === SCROLL-TRIGGERED SECTION ANIMATIONS ===
      gsap.utils.toArray(".reveal-section").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      });

      // Cleanup: revert SplitText on context change
      return () => {
        if (contentSplit.headlineChars) contentSplit.headlineChars.revert();
        if (contentSplit.subtextLines) contentSplit.subtextLines.revert();
      };
    },
  );
});

// ===== CAKE BOOKING FORM LOGIC =====
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("booking-modal");
  const card = document.getElementById("booking-card");
  const backdrop = document.getElementById("booking-backdrop");
  const openBtn = document.getElementById("open-booking-btn");
  const closeBtn = document.getElementById("close-booking-btn");
  const nextBtn = document.getElementById("form-next");
  const prevBtn = document.getElementById("form-prev");
  const progress = document.getElementById("form-progress");
  const stepLabel = document.getElementById("step-label");
  const form = document.getElementById("cake-form");
  const formNav = document.getElementById("form-nav");
  const successEl = document.getElementById("form-success");
  const addressField = document.getElementById("address-field");

  if (!modal || !openBtn) return;

  let currentStep = 1;
  const totalSteps = 3;

  function openModal() {
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.classList.add("pointer-events-auto", "opacity-100");
    document.body.style.overflow = "hidden";
    gsap.fromTo(
      card,
      { scale: 0.9, y: 40, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
    );
    animateFieldsIn(1);
  }

  function closeModal() {
    gsap.to(card, {
      scale: 0.9,
      y: 30,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add("pointer-events-none", "opacity-0");
        modal.classList.remove("pointer-events-auto", "opacity-100");
        document.body.style.overflow = "";
        resetForm();
      },
    });
  }

  function resetForm() {
    currentStep = 1;
    form.reset();
    successEl.classList.add("hidden");
    formNav.classList.remove("hidden");
    document.querySelectorAll(".form-step").forEach((s, i) => {
      s.classList.toggle("hidden", i !== 0);
    });
    updateProgress();
    addressField.style.display = "none";
  }

  function updateProgress() {
    const pct = (currentStep / totalSteps) * 100;
    progress.style.width = `${pct}%`;
    stepLabel.textContent = `${currentStep} / ${totalSteps}`;
    prevBtn.classList.toggle("invisible", currentStep === 1);
    if (currentStep === totalSteps) {
      nextBtn.innerHTML =
        'Send Booking <span class="material-icons text-base">check</span>';
    } else {
      nextBtn.innerHTML =
        'Next <span class="material-icons text-base">arrow_forward</span>';
    }
  }

  function animateFieldsIn(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!stepEl) return;
    const fields = stepEl.querySelectorAll(".form-field");
    gsap.fromTo(
      fields,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.1,
      },
    );
  }

  function validateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!stepEl) return true;
    const inputs = stepEl.querySelectorAll("[required]");
    let valid = true;
    inputs.forEach((inp) => {
      if (!inp.value || inp.value.trim() === "") {
        valid = false;
        gsap.fromTo(
          inp,
          { x: -6 },
          {
            x: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.3)",
          },
        );
        inp.style.borderColor = "#ef4444";
        inp.addEventListener(
          "input",
          () => {
            inp.style.borderColor = "";
          },
          { once: true },
        );
      }
    });
    return valid;
  }

  function goToStep(newStep) {
    if (newStep < 1 || newStep > totalSteps) return;
    const oldStepEl = document.querySelector(
      `.form-step[data-step="${currentStep}"]`,
    );
    const newStepEl = document.querySelector(
      `.form-step[data-step="${newStep}"]`,
    );
    if (!oldStepEl || !newStepEl) return;

    const direction = newStep > currentStep ? 1 : -1;

    gsap.to(oldStepEl, {
      x: direction * -40,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        oldStepEl.classList.add("hidden");
        newStepEl.classList.remove("hidden");
        gsap.fromTo(
          newStepEl,
          { x: direction * 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
        );
        currentStep = newStep;
        updateProgress();
        animateFieldsIn(newStep);
      },
    });
  }

  function submitForm() {
    const data = new FormData(form);
    const msg = [
      `🎂 *New Cake Booking*`,
      ``,
      `📅 Date: ${data.get("date")}`,
      `⏰ Time: ${data.get("time")}`,
      `👤 Name: ${data.get("name")}`,
      `📱 Phone: ${data.get("phone")}`,
      ``,
      `🍰 Flavour: ${data.get("flavour")}`,
      `⚖️ Weight: ${data.get("weight")}`,
      `🕯️ Candle: ${data.get("candle") || "None"}`,
      `✍️ Message: ${data.get("message") || "None"}`,
      `🥚 Eggless: ${data.get("eggless") ? "Yes" : "No"}`,
      ``,
      `🚗 Delivery: ${data.get("delivery") === "deliver" ? "Home Delivery" : "Self Pickup"}`,
      data.get("delivery") === "deliver"
        ? `📍 Address: ${data.get("address")}`
        : "",
      data.get("specs") ? `📝 Specs: ${data.get("specs")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Show success animation
    const lastStep = document.querySelector(
      `.form-step[data-step="${currentStep}"]`,
    );
    gsap.to(lastStep, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        lastStep.classList.add("hidden");
        formNav.classList.add("hidden");
        successEl.classList.remove("hidden");
        gsap.fromTo(
          successEl,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
        );
        gsap.fromTo(
          successEl.querySelector(".material-icons"),
          { rotate: -180, scale: 0 },
          {
            rotate: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(2)",
            delay: 0.15,
          },
        );
        progress.style.width = "100%";
        stepLabel.textContent = "✓";
      },
    });

    // Open WhatsApp with the booking details
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    setTimeout(() => window.open(waUrl, "_blank"), 1500);

    // Log to console for now
    console.log("Cake Booking:", Object.fromEntries(data));
  }

  // Event listeners
  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else {
      submitForm();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  // Toggle address field based on delivery radio
  document.querySelectorAll('input[name="delivery"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const show = e.target.value === "deliver";
      if (show) {
        addressField.style.display = "block";
        gsap.fromTo(
          addressField,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" },
        );
        addressField.querySelector("textarea").required = true;
      } else {
        gsap.to(addressField, {
          height: 0,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            addressField.style.display = "none";
            addressField.querySelector("textarea").required = false;
          },
        });
      }
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("opacity-0")) {
      closeModal();
    }
  });
});

// ===== UNIFIED SCATTER GALLERY WITH INTRO =====
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".scatter-gallery");
  const introHeading = document.querySelector(".intro-heading");
  const galleryHeading = document.querySelector(".scatter-heading");
  const cardsContainer = document.querySelector(".stacked-cards-container");
  if (!gallery || !galleryHeading || !cardsContainer) return;

  // All bakery images — cycled across cards
  const IMAGES = [
    { src: "/images/chocolate-cake.png", alt: "Chocolate layer cake" },
    { src: "/images/gallery-cupcakes.png", alt: "Pastel cupcakes" },
    { src: "/images/artisan-bread.png", alt: "Artisan sourdough bread" },
    { src: "/images/gallery-cinnamon-rolls.png", alt: "Cinnamon rolls" },
    { src: "/images/celebration-cake.png", alt: "Celebration cake" },
    { src: "/images/gallery-macarons.png", alt: "French macarons" },
    { src: "/images/pastries.png", alt: "Pastries platter" },
    { src: "/images/assorted-cookies.png", alt: "Assorted cookies" },
    { src: "/images/baker-story.png", alt: "Baker at work" },
  ];

  const HEADINGS = [
    "Every creation begins with flour, butter & a little bit of magic",
    "Layered with love, frosted with care, baked to perfection",
    "From our oven to your celebration — every bite tells a story",
    "These are the moments we bake for",
  ];

  function getResponsiveConfig() {
    const w = window.innerWidth;
    if (w <= 480) return { cardCount: 5, cardWidth: 140, cardHeight: 180 };
    if (w <= 768) return { cardCount: 8, cardWidth: 180, cardHeight: 230 };
    if (w <= 1024) return { cardCount: 10, cardWidth: 220, cardHeight: 280 };
    return { cardCount: 14, cardWidth: 260, cardHeight: 330 };
  }

  const CONFIG = {
    ...getResponsiveConfig(),
    animationDuration: 0.6,
    animationOverlap: 0.35,
    headingFadeDuration: 0.3,
  };

  const EXCLUSION = { wRatio: 0.5, hRatio: 0.3 };

  let state = {
    activeCards: [],
    currentSection: -1, // -1 = intro phase, 0-3 = scatter sections
    isAnimating: false,
    introComplete: false,
  };

  // Pre-calculate stable scatter positions for the first card set
  // Uses seeded randomness so positions are deterministic
  function seededRandom(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  }

  function isInExclusionZone(x, y) {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const exW = cw * EXCLUSION.wRatio;
    const exH = ch * EXCLUSION.hRatio;
    const exLeft = (cw - exW) / 2;
    const exTop = (ch - exH) / 2;
    return (
      x + CONFIG.cardWidth > exLeft &&
      x < exLeft + exW &&
      y + CONFIG.cardHeight > exTop &&
      y < exTop + exH
    );
  }

  function getScatterPosition(index, setIndex) {
    const pad = 20;
    const seed = index * 137 + setIndex * 31;
    let x,
      y,
      attempts = 0;
    do {
      x =
        pad +
        seededRandom(seed + attempts * 7) *
          (window.innerWidth - CONFIG.cardWidth - pad * 2);
      y =
        pad +
        seededRandom(seed + attempts * 13 + 100) *
          (window.innerHeight - CONFIG.cardHeight - pad * 2);
      attempts++;
    } while (isInExclusionZone(x, y) && attempts < 30);
    return { x, y, rotation: (seededRandom(seed + 200) - 0.5) * 30 };
  }

  function getEdgePosition(cx, cy) {
    const distances = {
      left: cx,
      right: window.innerWidth - cx,
      top: cy,
      bottom: window.innerHeight - cy,
    };
    const minDistance = Math.min(...Object.values(distances));
    const offsetX = CONFIG.cardWidth / 2;
    const offsetY = CONFIG.cardHeight / 2;
    const vary = () => (Math.random() - 0.5) * 300;

    if (minDistance === distances.left)
      return {
        x: -CONFIG.cardWidth - Math.random() * 150,
        y: cy - offsetY + vary(),
      };
    if (minDistance === distances.right)
      return {
        x: window.innerWidth + 50 + Math.random() * 150,
        y: cy - offsetY + vary(),
      };
    if (minDistance === distances.top)
      return {
        x: cx - offsetX + vary(),
        y: -CONFIG.cardHeight - Math.random() * 150,
      };
    return {
      x: cx - offsetX + vary(),
      y: window.innerHeight + 50 + Math.random() * 150,
    };
  }

  // ---- INTRO CARDS ----
  // Create stacked intro cards (use same images as first scatter set)
  const introCards = [];
  const introCardCount = Math.min(CONFIG.cardCount, IMAGES.length);

  for (let i = 0; i < introCardCount; i++) {
    const card = document.createElement("div");
    card.classList.add("intro-card");
    card.style.width = CONFIG.cardWidth + "px";
    card.style.height = CONFIG.cardHeight + "px";

    const imgData = IMAGES[i % IMAGES.length];
    const img = document.createElement("img");
    img.src = imgData.src;
    img.alt = imgData.alt;
    img.loading = "eager";
    card.appendChild(img);
    cardsContainer.appendChild(card);

    // Stack position: center of viewport
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const stackOffset = i * 3;
    const stackRotation = (i - introCardCount / 2) * 2;

    gsap.set(card, {
      x: cx - CONFIG.cardWidth / 2 + stackOffset,
      y: cy - CONFIG.cardHeight / 2 - stackOffset,
      rotation: stackRotation,
      scale: 1 - i * 0.015,
      zIndex: introCardCount - i,
      opacity: 1,
    });

    // Pre-calculate where this card should land (scatter position for set 0)
    const target = getScatterPosition(i, 0);

    introCards.push({
      element: card,
      index: i,
      targetX: target.x,
      targetY: target.y,
      targetRotation: target.rotation,
    });
  }

  // Hide scatter heading initially
  gsap.set(galleryHeading, { opacity: 0 });

  // ---- SCATTER GALLERY CARDS (for sets 0-3) ----
  function createCards(setIndex) {
    const cards = [];
    const offset = (setIndex * 3) % IMAGES.length;

    for (let i = 0; i < CONFIG.cardCount; i++) {
      const card = document.createElement("div");
      card.classList.add("scatter-card");
      card.style.width = CONFIG.cardWidth + "px";
      card.style.height = CONFIG.cardHeight + "px";

      const imgData = IMAGES[(i + offset) % IMAGES.length];
      const img = document.createElement("img");
      img.src = imgData.src;
      img.loading = "eager";
      img.alt = imgData.alt;
      card.appendChild(img);

      const pos = getScatterPosition(i, setIndex);

      gsap.set(card, {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        force3D: true,
      });

      gallery.appendChild(card);
      cards.push({
        element: card,
        centerX: pos.x + CONFIG.cardWidth / 2,
        centerY: pos.y + CONFIG.cardHeight / 2,
      });
    }
    return cards;
  }

  function animateHeading(newText) {
    const tl = gsap.timeline();
    tl.to(galleryHeading, {
      opacity: 0,
      duration: CONFIG.headingFadeDuration,
      ease: "power2.inOut",
    })
      .call(() => {
        galleryHeading.textContent = newText;
      })
      .to(galleryHeading, {
        opacity: 1,
        duration: CONFIG.headingFadeDuration,
        ease: "power2.inOut",
      });
    return tl;
  }

  function animateCards(exitingCards, enteringCards) {
    const tl = gsap.timeline();

    exitingCards.forEach(({ element, centerX, centerY }) => {
      const edge = getEdgePosition(centerX, centerY);
      tl.to(
        element,
        {
          x: edge.x,
          y: edge.y,
          rotation: Math.random() * 180 - 90,
          duration: CONFIG.animationDuration,
          ease: "power2.in",
          force3D: true,
          onComplete: () => element.remove(),
        },
        0,
      );
    });

    enteringCards.forEach(({ element, centerX, centerY }) => {
      const edge = getEdgePosition(centerX, centerY);
      gsap.set(element, {
        x: edge.x,
        y: edge.y,
        rotation: Math.random() * 180 - 90,
        force3D: true,
      });
      tl.to(
        element,
        {
          x: centerX - CONFIG.cardWidth / 2,
          y: centerY - CONFIG.cardHeight / 2,
          rotation: Math.random() * 40 - 20,
          duration: CONFIG.animationDuration + 0.2,
          ease: "back.out(1.2)",
          force3D: true,
          onComplete: () => {
            gsap.to(element, {
              y: "+=12",
              rotation: "+=2",
              duration: 2 + Math.random() * 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          },
        },
        CONFIG.animationOverlap,
      );
    });

    return tl;
  }

  function transitionToSection(targetSection) {
    if (state.isAnimating || targetSection === state.currentSection) return;
    state.isAnimating = true;
    const newCards = createCards(targetSection);

    const masterTl = gsap.timeline({
      onComplete: () => {
        state.activeCards = newCards;
        state.currentSection = targetSection;
        state.isAnimating = false;
      },
    });

    masterTl.add(animateCards(state.activeCards, newCards), 0);
    masterTl.add(animateHeading(HEADINGS[targetSection]), 0);
  }

  // Map progress (after intro) to scatter section index
  function getSectionIndex(scatterProgress) {
    if (scatterProgress < 0.25) return 0;
    if (scatterProgress < 0.5) return 1;
    if (scatterProgress < 0.75) return 2;
    return 3;
  }

  // Lerp helper for smooth interpolation
  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  // ---- UNIFIED SCROLL TRIGGER ----
  // Total scroll = 3vh intro + 5vh scatter = 8vh
  const introScrollVH = 3;
  const scatterScrollVH = 5;
  const totalScrollVH = introScrollVH + scatterScrollVH;
  const introRatio = introScrollVH / totalScrollVH; // ~0.375

  ScrollTrigger.create({
    trigger: ".scatter-gallery",
    start: "top top",
    end: () => `+=${window.innerHeight * totalScrollVH}`,
    pin: true,
    pinSpacing: true,
    onUpdate: ({ progress }) => {
      if (progress <= introRatio) {
        // ======= INTRO PHASE =======
        const introProgress = progress / introRatio; // 0 → 1

        // Phase A (0-0.35): Heading visible, cards stacked
        // Phase B (0.35-0.7): Heading fades, cards spread outward
        // Phase C (0.7-1.0): Cards fly to scatter positions

        // Heading fade
        if (introProgress < 0.35) {
          gsap.set(introHeading, { opacity: 1 });
        } else if (introProgress < 0.55) {
          const fadeP = (introProgress - 0.35) / 0.2;
          gsap.set(introHeading, { opacity: 1 - fadeP });
        } else {
          gsap.set(introHeading, { opacity: 0 });
        }

        // Cards animation
        introCards.forEach(
          ({ element, index, targetX, targetY, targetRotation }) => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const stackX = cx - CONFIG.cardWidth / 2 + index * 3;
            const stackY = cy - CONFIG.cardHeight / 2 - index * 3;
            const stackRot = (index - introCardCount / 2) * 2;
            const stackScale = 1 - index * 0.015;

            if (introProgress < 0.35) {
              // Phase A: Stacked in center (with subtle breathing)
              const breathe = Math.sin(introProgress * Math.PI * 4) * 2;
              gsap.set(element, {
                x: stackX,
                y: stackY + breathe,
                rotation: stackRot,
                scale: stackScale,
                opacity: 1,
              });
            } else if (introProgress < 0.7) {
              // Phase B: Spread outward in circle
              const spreadP = (introProgress - 0.35) / 0.35;
              const angle =
                (index / introCardCount) * Math.PI * 2 - Math.PI / 2;
              const spreadDist =
                spreadP *
                Math.min(window.innerWidth, window.innerHeight) *
                0.25;
              const spreadX =
                cx + Math.cos(angle) * spreadDist - CONFIG.cardWidth / 2;
              const spreadY =
                cy + Math.sin(angle) * spreadDist - CONFIG.cardHeight / 2;
              const spreadRot =
                stackRot + spreadP * ((index % 2 === 0 ? 1 : -1) * 15);

              gsap.set(element, {
                x: lerp(stackX, spreadX, spreadP),
                y: lerp(stackY, spreadY, spreadP),
                rotation: spreadRot,
                scale: lerp(stackScale, 1, spreadP),
                opacity: 1,
              });
            } else {
              // Phase C: Fly to scatter gallery target positions
              const flyP = (introProgress - 0.7) / 0.3;
              const eased = 1 - Math.pow(1 - flyP, 3); // easeOutCubic

              const angle =
                (index / introCardCount) * Math.PI * 2 - Math.PI / 2;
              const spreadDist =
                Math.min(window.innerWidth, window.innerHeight) * 0.25;
              const spreadX =
                cx + Math.cos(angle) * spreadDist - CONFIG.cardWidth / 2;
              const spreadY =
                cy + Math.sin(angle) * spreadDist - CONFIG.cardHeight / 2;
              const spreadRot = stackRot + (index % 2 === 0 ? 1 : -1) * 15;

              gsap.set(element, {
                x: lerp(spreadX, targetX, eased),
                y: lerp(spreadY, targetY, eased),
                rotation: lerp(spreadRot, targetRotation, eased),
                scale: 1,
                opacity: 1,
              });
            }
          },
        );

        // Show scatter heading when intro is nearly done
        if (introProgress > 0.9) {
          const headFade = (introProgress - 0.9) / 0.1;
          galleryHeading.textContent = HEADINGS[0];
          gsap.set(galleryHeading, { opacity: headFade });
        } else {
          gsap.set(galleryHeading, { opacity: 0 });
        }

        // Reset scatter state when scrolling back into intro
        if (state.introComplete) {
          state.introComplete = false;
          state.currentSection = -1;
          state.isAnimating = false;
          // Kill and remove ALL scatter-card elements in the gallery
          // (including orphaned/mid-transition ones not in state.activeCards)
          gallery.querySelectorAll(".scatter-card").forEach((el) => {
            gsap.killTweensOf(el);
            el.remove();
          });
          state.activeCards = [];
          // Re-append intro cards to container if they were removed from DOM
          introCards.forEach(({ element }) => {
            gsap.killTweensOf(element);
            if (!element.parentNode) {
              cardsContainer.appendChild(element);
            }
            gsap.set(element, { display: "block", opacity: 1 });
          });
        }
      } else {
        // ======= SCATTER GALLERY PHASE =======
        const scatterProgress = (progress - introRatio) / (1 - introRatio);

        // On first entry: keep intro cards visible, register them as scatter active cards
        if (!state.introComplete) {
          state.introComplete = true;
          // Hide intro heading
          gsap.set(introHeading, { opacity: 0 });
          // Show scatter heading
          galleryHeading.textContent = HEADINGS[0];
          gsap.set(galleryHeading, { opacity: 1 });
          // Register intro cards as the scatter gallery's active cards
          // so they persist and get animated out when transitioning to section 1
          state.activeCards = introCards.map(
            ({ element, targetX, targetY, targetRotation }) => ({
              element,
              centerX: targetX + CONFIG.cardWidth / 2,
              centerY: targetY + CONFIG.cardHeight / 2,
            }),
          );
          state.currentSection = 0;
          state.isAnimating = false;
        }

        // Drive scatter section transitions
        const targetSection = getSectionIndex(scatterProgress);
        transitionToSection(targetSection);
      }
    },
  });

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Update config
      const responsive = getResponsiveConfig();
      CONFIG.cardCount = responsive.cardCount;
      CONFIG.cardWidth = responsive.cardWidth;
      CONFIG.cardHeight = responsive.cardHeight;

      // Update intro card sizes and targets
      introCards.forEach((card) => {
        card.element.style.width = CONFIG.cardWidth + "px";
        card.element.style.height = CONFIG.cardHeight + "px";
        const pos = getScatterPosition(card.index, 0);
        card.targetX = pos.x;
        card.targetY = pos.y;
        card.targetRotation = pos.rotation;
      });

      if (state.introComplete) {
        // Check if the active cards are still the intro cards
        const introIsActive = introCards.some((ic) =>
          state.activeCards.some((ac) => ac.element === ic.element),
        );
        if (introIsActive) {
          // Re-register intro cards with new positions
          state.activeCards = introCards.map(
            ({ element, targetX, targetY }) => ({
              element,
              centerX: targetX + CONFIG.cardWidth / 2,
              centerY: targetY + CONFIG.cardHeight / 2,
            }),
          );
          // Reposition them
          introCards.forEach(
            ({ element, targetX, targetY, targetRotation }) => {
              gsap.set(element, {
                x: targetX,
                y: targetY,
                rotation: targetRotation,
              });
            },
          );
        } else {
          // Normal scatter cards — recreate
          state.activeCards.forEach(({ element }) => element.remove());
          state.activeCards = createCards(state.currentSection);
        }
      }

      ScrollTrigger.refresh();
    }, 250);
  });
});

// ===== MENU SECTION GSAP ANIMATIONS =====
document.addEventListener("DOMContentLoaded", () => {
  const menuSection = document.getElementById("menu");
  if (!menuSection) return;

  // Animate menu header elements
  const menuHeader = menuSection.querySelector(".menu-header");
  if (menuHeader) {
    const subtitle = menuHeader.querySelector(".menu-subtitle");
    const title = menuHeader.querySelector(".menu-title-text");
    const line = menuHeader.querySelector(".menu-line");

    // Set initial states
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 20 });
    if (title) gsap.set(title, { y: "100%" });
    if (line) gsap.set(line, { scaleX: 0 });

    // Animate on scroll
    const headerTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: menuHeader,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    if (subtitle) {
      headerTimeline.to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }

    if (title) {
      headerTimeline.to(
        title,
        {
          y: "0%",
          duration: 1,
          ease: "power4.out",
        },
        "-=0.5",
      );
    }

    if (line) {
      headerTimeline.to(
        line,
        {
          scaleX: 1,
          duration: 0.8,
          ease: "power2.inOut",
        },
        "-=0.5",
      );
    }
  }

  // Animate background gradient
  const bgGradient = menuSection.querySelector(".menu-bg-gradient");
  if (bgGradient) {
    gsap.to(bgGradient, {
      scrollTrigger: {
        trigger: menuSection,
        start: "top center",
        end: "bottom center",
        scrub: 1,
      },
      rotation: 360,
      scale: 1.2,
      ease: "none",
    });
  }

  // Animate menu items
  const menuItems = menuSection.querySelectorAll(".menu-item");
  menuItems.forEach((item, index) => {
    const imgWrap = item.querySelector(".menu-img-wrap");
    const img = item.querySelector(".menu-img-wrap img");
    const text = item.querySelector(".menu-text");

    // Set initial states
    gsap.set(item, { opacity: 0 });
    if (img) gsap.set(img, { scale: 1.2 });
    if (text) gsap.set(text, { y: 20, opacity: 0 });

    // Create timeline for this item
    const itemTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    // Card fade in with slight rotation
    itemTimeline.to(item, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
    });

    // Image scale down (ken burns effect)
    if (img) {
      itemTimeline.to(
        img,
        {
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
        },
        "-=0.4",
      );
    }

    // Text reveal
    if (text) {
      itemTimeline.to(
        text,
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.8",
      );
    }

    // Parallax effect on scroll
    if (img) {
      gsap.to(img, {
        scrollTrigger: {
          trigger: item,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -30,
        ease: "none",
      });
    }

    // Magnetic hover effect
    item.addEventListener("mouseenter", () => {
      gsap.to(item, {
        scale: 1.02,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    item.addEventListener("mouseleave", () => {
      gsap.to(item, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    });
  });

  // Animate CTA section
  const ctaWrap = menuSection.querySelector(".menu-cta-wrap");
  if (ctaWrap) {
    gsap.from(ctaWrap, {
      scrollTrigger: {
        trigger: ctaWrap,
        start: "top 90%",
        toggleActions: "play none none none",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }
});

// ===== TESTIMONIALS 360° INFINITE SCROLL WITH GSAP =====
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("testimonials-infinite-wrapper");
  const track = document.getElementById("testimonials-infinite-track");

  if (!wrapper || !track) return;

  // Clone testimonials for seamless infinite loop
  const comments = Array.from(track.children);

  // Clone the entire set multiple times for smooth infinite scroll
  const clones = [];
  for (let i = 0; i < 3; i++) {
    comments.forEach((comment) => {
      const clone = comment.cloneNode(true);
      track.appendChild(clone);
      clones.push(clone);
    });
  }

  // Calculate total width of one set
  const gap = 24; // 1.5rem gap
  const commentWidth = 320; // width of each comment
  const setWidth = comments.length * (commentWidth + gap);

  // Initial reveal animation
  gsap.from([...comments, ...clones], {
    scrollTrigger: {
      trigger: "#testimonials",
      start: "top 80%",
      toggleActions: "play none none none",
    },
    opacity: 0,
    y: 40,
    scale: 0.9,
    stagger: 0.08,
    duration: 0.8,
    ease: "power3.out",
  });

  // Create seamless infinite scroll animation
  let scrollTween;

  function createInfiniteScroll() {
    // Calculate duration based on content width (slower = more readable)
    const speed = 30; // pixels per second
    const duration = setWidth / speed;

    if (scrollTween) {
      scrollTween.kill();
    }

    scrollTween = gsap.to(track, {
      x: -setWidth,
      duration: duration,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          return (parseFloat(x) % setWidth);
        }),
      },
    });
  }

  createInfiniteScroll();

  // Pause on hover for better UX
  let isPaused = false;

  wrapper.addEventListener("mouseenter", () => {
    if (!isPaused) {
      gsap.to(scrollTween, { timeScale: 0.3, duration: 0.5, ease: "power2.out" });

      // Add hover effect to all comments
      const allComments = track.querySelectorAll(".testimonial-comment");
      allComments.forEach((comment) => {
        comment.addEventListener("mouseenter", () => {
          gsap.to(comment, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        comment.addEventListener("mouseleave", () => {
          gsap.to(comment, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });
    }
  });

  wrapper.addEventListener("mouseleave", () => {
    if (!isPaused) {
      gsap.to(scrollTween, { timeScale: 1, duration: 0.5, ease: "power2.in" });
    }
  });

  // Click to pause/play
  wrapper.addEventListener("click", () => {
    isPaused = !isPaused;
    if (isPaused) {
      gsap.to(scrollTween, { timeScale: 0, duration: 0.3, ease: "power2.out" });
    } else {
      gsap.to(scrollTween, { timeScale: 1, duration: 0.3, ease: "power2.in" });
    }
  });

  // Handle resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      createInfiniteScroll();
    }, 250);
  });
});
