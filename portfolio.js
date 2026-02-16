import gsap from "gsap";
import Lenis from "lenis";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const cardContainers = document.querySelectorAll(".card-container");

cardContainers.forEach((cardContainer) => {
  const cardPaths = cardContainer.querySelectorAll(".svg-stroke path");
  const cardTitle = cardContainer.querySelector(".card-info h3");
  const cardTag = cardContainer.querySelector(".card-tag");
  const cardDesc = cardContainer.querySelector(".card-desc");
  const cardPrice = cardContainer.querySelector(".card-price");

  const split = SplitText.create(cardTitle, {
    type: "words",
    mask: "words",
  });

  gsap.set(split.words, { yPercent: 100 });

  cardPaths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
      attr: { "stroke-width": 200 },
    });
  });

  const tl = gsap.timeline({ paused: true });

  // SVG stroke draw-in
  cardPaths.forEach((path) => {
    tl.to(
      path,
      {
        strokeDashoffset: 0,
        attr: { "stroke-width": 700 },
        duration: 1.5,
        ease: "power2.out",
      },
      0,
    );
  });

  // Category tag fade + slide
  tl.to(
    cardTag,
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    },
    0.15,
  );

  // Title word reveal
  tl.to(
    split.words,
    {
      yPercent: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.06,
    },
    0.25,
  );

  // Description fade in
  tl.to(
    cardDesc,
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
    },
    0.4,
  );

  // Price fade in
  tl.to(
    cardPrice,
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    },
    0.55,
  );

  // Initial states for fade elements (start below + invisible)
  gsap.set([cardTag, cardDesc, cardPrice], { y: 12, opacity: 0 });

  cardContainer.addEventListener("mouseenter", () => {
    tl.timeScale(1).play();
  });

  cardContainer.addEventListener("mouseleave", () => {
    tl.timeScale(1.5).reverse();
  });
});

// Fade out hover hint on first card hover
const hoverHint = document.querySelector(".hover-hint");
if (hoverHint) {
  let hintVisible = true;
  document.querySelector(".bento-grid").addEventListener(
    "mouseenter",
    () => {
      if (hintVisible) {
        hintVisible = false;
        gsap.to(hoverHint, {
          opacity: 0,
          y: -8,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            hoverHint.style.display = "none";
          },
        });
      }
    },
    { once: true },
  );
}
