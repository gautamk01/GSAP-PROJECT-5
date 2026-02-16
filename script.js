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

  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  // === PRELOADER TIMELINE (universal — same on all viewports) ===
  const t1 = gsap.timeline({ delay: 0.5 });

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

  // === PRELOADER EXIT (different approach for mobile vs desktop) ===
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

  // === REVEAL PAGE CONTENT ===
  // Nav fades in first
  t1.to(
    "nav",
    { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
    isMobile ? "-=0.3" : "-=1.5",
  );

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

      // Set initial states (hidden)
      if (contentSplit.headlineChars)
        gsap.set(contentSplit.headlineChars.chars, { y: "100%" });
      if (contentSplit.subtextLines)
        gsap.set(contentSplit.subtextLines.lines, { y: "100%" });
      gsap.set(".scatter-img", { scale: 0, opacity: 0 });
      gsap.set(".btn-oval", { scale: 0, opacity: 0 });

      // Show main + footer + sections containers (content still hidden via individual animations)
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

// ===== SCATTER GALLERY =====
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".scatter-gallery");
  const galleryHeading = document.querySelector(".scatter-heading");
  if (!gallery || !galleryHeading) return;

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

  // Bakery-themed headings for each scroll section
  const HEADINGS = [
    "Every creation begins with flour, butter & a little bit of magic",
    "Layered with love, frosted with care, baked to perfection",
    "From our oven to your celebration — every bite tells a story",
    "These are the moments we bake for",
  ];

  function getResponsiveConfig() {
    const w = window.innerWidth;
    if (w <= 480) return { cardCount: 6, cardWidth: 120, cardHeight: 150 };
    if (w <= 768) return { cardCount: 8, cardWidth: 150, cardHeight: 190 };
    if (w <= 1024) return { cardCount: 12, cardWidth: 200, cardHeight: 250 };
    return { cardCount: 15, cardWidth: 250, cardHeight: 300 };
  }

  const CONFIG = {
    ...getResponsiveConfig(),
    animationDuration: 0.6,
    animationOverlap: 0.35,
    headingFadeDuration: 0.3,
  };

  // Exclusion zone: cards must stay outside this center box (heading area)
  const EXCLUSION = { wRatio: 0.3, hRatio: 0.25 };

  let state = {
    activeCards: [],
    currentSection: 0,
    isAnimating: false,
  };

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

  function createCards(setIndex) {
    const cards = [];
    const offset = (setIndex * 3) % IMAGES.length;
    const pad = 20; // padding from viewport edge

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

      // Random position across entire viewport, retry if in exclusion zone
      let x, y;
      let attempts = 0;
      do {
        x =
          pad +
          Math.random() * (window.innerWidth - CONFIG.cardWidth - pad * 2);
        y =
          pad +
          Math.random() * (window.innerHeight - CONFIG.cardHeight - pad * 2);
        attempts++;
      } while (isInExclusionZone(x, y) && attempts < 30);

      const cx = x + CONFIG.cardWidth / 2;
      const cy = y + CONFIG.cardHeight / 2;

      gsap.set(card, {
        x: x,
        y: y,
        rotation: Math.random() * 30 - 15,
        force3D: true,
      });

      gallery.appendChild(card);
      cards.push({ element: card, centerX: cx, centerY: cy });
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
          duration: CONFIG.animationDuration,
          ease: "power2.out",
          force3D: true,
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

  function getSectionIndex(progress) {
    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }

  function reinitialize() {
    state.activeCards.forEach(({ element }) => element.remove());
    const responsive = getResponsiveConfig();
    CONFIG.cardCount = responsive.cardCount;
    CONFIG.cardWidth = responsive.cardWidth;
    CONFIG.cardHeight = responsive.cardHeight;
    state.activeCards = createCards(state.currentSection);
  }

  // Initialize scatter gallery
  state.activeCards = createCards(0);
  galleryHeading.textContent = HEADINGS[0];
  gsap.set(galleryHeading, { opacity: 1 });

  // ScrollTrigger pins the gallery and drives transitions
  ScrollTrigger.create({
    trigger: ".scatter-gallery",
    start: "top top",
    end: () => `+=${window.innerHeight * 5}`,
    pin: true,
    pinSpacing: true,
    onUpdate: ({ progress }) => {
      const targetSection = getSectionIndex(progress);
      transitionToSection(targetSection);
    },
  });

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      reinitialize();
      ScrollTrigger.refresh();
    }, 250);
  });
});
