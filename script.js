import gsap from "gsap";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

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
  gsap.set("nav, main, footer", { autoAlpha: 0 });

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

      // Show main + footer containers (content still hidden via individual animations)
      t1.to(
        "main, footer",
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

      // Cleanup: revert SplitText on context change
      return () => {
        if (contentSplit.headlineChars) contentSplit.headlineChars.revert();
        if (contentSplit.subtextLines) contentSplit.subtextLines.revert();
      };
    },
  );
});
