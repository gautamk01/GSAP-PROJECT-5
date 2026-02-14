import gsap from "gsap";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

document.fonts.ready.then(() => {
  function createSplitTexts(elements) {
    const split = {};

    elements.forEach(({ key, selector, type }) => {
      // Check if element exists before splitting to avoid errors
      if (document.querySelector(selector)) {
        const config = { type, mask: type };
        if (type === "chars") config.charsClass = "char";
        if (type === "lines") config.linesClass = "line";
        split[key] = SplitText.create(selector, config);
      }
    });
    return split;
  }

  // Updated selectors for Miche Bakery layout
  const splitElements = [
    { key: "logoChars", selector: ".preloader-logo h1", type: "chars" },
    { key: "footerLine", selector: ".preloader-footer p", type: "lines" },
    // New selectors
    { key: "headlineChars", selector: "main h2", type: "chars" },
    { key: "subtextLines", selector: "main p", type: "lines" },
  ];

  const split = createSplitTexts(splitElements);

  // Set initial states (hidden)
  if (split.footerLine) gsap.set(split.footerLine.words, { y: "100%" });
  if (split.headlineChars) gsap.set(split.headlineChars.chars, { y: "100%" });
  if (split.subtextLines) gsap.set(split.subtextLines.lines, { y: "100%" });

  // New elements initial states
  gsap.set(".scatter-img", { scale: 0, opacity: 0 });
  gsap.set(".btn-oval", { scale: 0, opacity: 0 });

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

  const t1 = gsap.timeline({ delay: 0.5 });

  // --- Preloader Animation (Unchanged Logic, just targeting valid elements) ---
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
  }); // var(--base-300)

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

  t1.to(
    ".preloader-progress",
    { opacity: 0, duration: 0.5, ease: "power3.out" },
    "-=0.25",
  ).to(".preloader-mask", { scale: 5, duration: 2.5, ease: "power3.out" }, "<");

  // --- Reveal New Miche Bakery Content ---
  // Animate the scattered images
  t1.to(
    ".scatter-img",
    {
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: "power3.out",
      stagger: 0.2,
    },
    "-=1.5", // Overlap with mask reveal
  );

  // Animate Headline
  if (split.headlineChars) {
    t1.to(
      split.headlineChars.chars,
      {
        y: 0,
        stagger: 0.03,
        duration: 1,
        ease: "power4.out",
      },
      "-=1.0",
    );
  }

  // Animate Subtext
  if (split.subtextLines) {
    t1.to(
      split.subtextLines.lines,
      {
        y: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power4.out",
      },
      "-=0.8",
    );
  }

  // Animate Button
  t1.to(
    ".btn-oval",
    {
      scale: 1,
      opacity: 1,
      duration: 1,
      ease: "power4.out",
    },
    "-=0.8",
  );
});
