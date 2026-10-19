// Single checkout URL for every purchase link on the page.
// Confirmed bundle checkout (both courses + the book) from the project notes.
const PAYMENT_URL = "https://abbascourses.tenmeya.com/step/all-course-checkout/";

// Deadline for the 39 د.ك offer. ISO 8601 with a time zone.
// TEST ONLY — 28 Oct 2026, 23:59 Kuwait time. Replace this with the confirmed
// deadline before publishing. After it passes, every [data-price] switches to 58.
const OFFER_END = "2026-10-28T23:59:59+03:00";

const checkoutLinks = document.querySelectorAll("[data-checkout]");
const hasPaymentUrl = typeof PAYMENT_URL === "string" && PAYMENT_URL.startsWith("https://");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

checkoutLinks.forEach((link) => {
  if (!hasPaymentUrl) {
    link.removeAttribute("href");
    link.removeAttribute("target");
    link.setAttribute("aria-disabled", "true");
    return;
  }

  link.href = PAYMENT_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  link.addEventListener("pointerdown", (event) => {
    if (reduceMotion || event.pointerType === "mouse") return;
    if (typeof navigator.vibrate === "function") navigator.vibrate(12);
  });
});

primeHeroVideo();
initHeroMotion();
initOffer();
initProofMotion();
initBundleMotion();
initTestimonialsMotion();
initStudentOutputsMotion();

function primeHeroVideo() {
  const video = document.querySelector(".hero-video");
  if (!video) return;
  video.muted = true;
  initVideoControls(video);

  if (reduceMotion) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }
  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
}

// Play/pause and sound buttons; labels and states follow the real video state.
function initVideoControls(video) {
  const box = document.querySelector(".hero-controls");
  const soundBtn = document.querySelector("[data-video-sound]");
  const playBtn = document.querySelector("[data-video-toggle]");
  if (!box || !soundBtn || !playBtn) return;

  const soundText = soundBtn.querySelector(".hero-ctl-text");

  const syncPlay = () => {
    const playing = !video.paused && !video.ended;
    playBtn.dataset.state = playing ? "playing" : "paused";
    playBtn.setAttribute("aria-label", playing ? "إيقاف الفيديو" : "تشغيل الفيديو");
  };

  const syncSound = () => {
    const label = video.muted ? "تشغيل الصوت" : "كتم الصوت";
    soundBtn.dataset.state = video.muted ? "off" : "on";
    soundBtn.setAttribute("aria-label", label);
    if (soundText) soundText.textContent = label;
  };

  playBtn.addEventListener("click", () => {
    if (video.paused) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
    } else {
      video.pause();
    }
  });

  soundBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (video.muted) return;
    video.volume = 1;
    if (video.paused) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
    }
  });

  video.addEventListener("play", syncPlay);
  video.addEventListener("pause", syncPlay);
  video.addEventListener("volumechange", syncSound);

  syncPlay();
  syncSound();
  box.hidden = false;
}

function initHeroMotion() {
  if (reduceMotion || typeof window.gsap === "undefined") return;

  // Soft entrance for the text; styles are cleared when finished.
  window.gsap.from(".hero-badge, .hero-title, .hero-lead, .hero-buy, .hero-points", {
    y: 14,
    opacity: 0,
    duration: 0.6,
    stagger: 0.07,
    ease: "power2.out",
    clearProps: "opacity,transform"
  });

  window.gsap.from(".hero-frame", {
    y: 20,
    opacity: 0,
    duration: 0.65,
    ease: "power2.out",
    clearProps: "opacity,transform"
  });

  window.gsap.from(".hero-accent", {
    y: 28,
    opacity: 0,
    duration: 0.75,
    delay: 0.05,
    ease: "power2.out",
    clearProps: "opacity,transform"
  });
}

// Offer countdown. The deadline is OFFER_END at the top of this file or data-offer-end on [data-offer].
// While the offer runs, [data-price] shows 39. After it ends, every price switches to 58.
function initOffer() {
  const offer = document.querySelector("[data-offer]");
  if (!offer) return;

  const offerPrice = offer.dataset.priceOffer || "٣٩";
  const regularPrice = offer.dataset.priceRegular || "٥٨";
  const prices = document.querySelectorAll("[data-price]");
  const liveBox = offer.querySelector("[data-offer-live]");
  const endedBox = offer.querySelector("[data-offer-ended]");
  const timerBox = offer.querySelector("[role='timer']");
  const cells = {
    days: offer.querySelector('[data-count="days"]'),
    hours: offer.querySelector('[data-count="hours"]'),
    minutes: offer.querySelector('[data-count="minutes"]'),
    seconds: offer.querySelector('[data-count="seconds"]')
  };
  const toArabic = (n) => {
    const text = String(Math.max(0, Math.floor(n)));
    return (text.length < 2 ? text.padStart(2, "0") : text).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[digit]);
  };
  const setPrices = (value) => prices.forEach((node) => { node.textContent = value; });

  offer.querySelectorAll("[data-offer-price]").forEach((node) => { node.textContent = offerPrice; });
  offer.querySelectorAll("[data-offer-regular]").forEach((node) => { node.textContent = regularPrice; });

  const rawEnd = (offer.dataset.offerEnd && offer.dataset.offerEnd.trim()) || OFFER_END;
  const end = Date.parse(rawEnd);

  if (Number.isNaN(end)) {
    setPrices(offerPrice);
    offer.dataset.state = "unset";
    if (timerBox) timerBox.setAttribute("aria-label", "العد التنازلي يظهر بعد تحديد موعد انتهاء العرض");
    return;
  }

  let timer = 0;
  let lastSec = -1;

  const tick = () => {
    const left = end - Date.now();

    if (left <= 0) {
      setPrices(regularPrice);
      if (liveBox) liveBox.hidden = true;
      if (endedBox) endedBox.hidden = false;
      offer.dataset.state = "ended";
      document.documentElement.dataset.offer = "ended";
      return;
    }

    const total = Math.floor(left / 1000);
    const sec = total % 60;

    if (cells.days) cells.days.textContent = toArabic(Math.floor(total / 86400));
    if (cells.hours) cells.hours.textContent = toArabic(Math.floor((total % 86400) / 3600));
    if (cells.minutes) cells.minutes.textContent = toArabic(Math.floor((total % 3600) / 60));

    if (cells.seconds) {
      cells.seconds.textContent = toArabic(sec);
      if (!reduceMotion && lastSec !== sec) {
        cells.seconds.dataset.tick = "1";
        window.setTimeout(() => {
          if (cells.seconds) cells.seconds.removeAttribute("data-tick");
        }, 160);
      }
    }
    lastSec = sec;

    if (timerBox && cells.days && cells.hours && cells.minutes) {
      timerBox.setAttribute("aria-label", "متبقٍ " + cells.days.textContent + " أيام و" + cells.hours.textContent + " ساعات و" + cells.minutes.textContent + " دقائق");
    }
    offer.dataset.state = "live";

    const delay = Math.min((left % 1000) || 1000, 2147483647);
    timer = window.setTimeout(tick, delay + 30);
  };

  setPrices(offerPrice);
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    window.clearTimeout(timer);
    tick();
  });
}

// Proof section entrance motion and interactive count-up
function initProofMotion() {
  const proofSection = document.getElementById("proof");
  if (!proofSection) return;

  const statNodes = proofSection.querySelectorAll("[data-stat-count]");
  if (!statNodes.length) return;

  const toArabic = (num, decimals = 0) => {
    const fixed = Number(num).toFixed(decimals);
    return fixed.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  };

  let hasRun = false;

  const triggerStats = () => {
    if (hasRun) return;
    hasRun = true;

    // Instant set if reduced motion preferred
    if (reduceMotion) {
      statNodes.forEach((node) => {
        const target = parseFloat(node.dataset.statCount);
        const dec = parseInt(node.dataset.statDecimals || "0", 10);
        node.textContent = toArabic(target, dec);
      });
      return;
    }

    // Orchestrated GSAP reveals
    if (typeof window.gsap !== "undefined") {
      window.gsap.from(".proof-stat", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power2.out",
        clearProps: "opacity,transform"
      });

      window.gsap.from(".offer", {
        y: 24,
        opacity: 0,
        duration: 0.8,
        delay: 0.22,
        ease: "power2.out",
        clearProps: "opacity,transform"
      });

      window.gsap.from(".orgs-header > *, .org-slot", {
        y: 16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        delay: 0.38,
        ease: "power2.out",
        clearProps: "opacity,transform"
      });
    }

    // High precision RAF count-up
    const duration = 1650;
    const startTime = performance.now();

    const animateCount = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic curve
      const ease = 1 - Math.pow(1 - progress, 3);

      statNodes.forEach((node) => {
        const target = parseFloat(node.dataset.statCount);
        const dec = parseInt(node.dataset.statDecimals || "0", 10);
        const current = target * ease;
        node.textContent = toArabic(current, dec);
      });

      if (progress < 1) {
        window.requestAnimationFrame(animateCount);
      } else {
        statNodes.forEach((node) => {
          const target = parseFloat(node.dataset.statCount);
          const dec = parseInt(node.dataset.statDecimals || "0", 10);
          node.textContent = toArabic(target, dec);
        });
      }
    };

    window.requestAnimationFrame(animateCount);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerStats();
          observer.disconnect();
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    observer.observe(proofSection);
  } else {
    triggerStats();
  }
}

// Orchestrated entrance reveals for the bundle / "What You Get" section
function initBundleMotion() {
  const bundleSection = document.getElementById("what-you-get");
  if (!bundleSection || reduceMotion || typeof window.gsap === "undefined") return;

  let hasRun = false;

  const triggerBundle = () => {
    if (hasRun) return;
    hasRun = true;

    window.gsap.from(".bundle-head > *", {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".bundle-card", {
      y: 24,
      opacity: 0,
      duration: 0.75,
      stagger: 0.12,
      delay: 0.15,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".bundle-bonus, .bundle-checkout > *", {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.1,
      delay: 0.35,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerBundle();
          observer.disconnect();
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    observer.observe(bundleSection);
  } else {
    triggerBundle();
  }
}

// Orchestrated entrance reveals for the testimonials / social proof section
function initTestimonialsMotion() {
  const testimonialsSection = document.getElementById("testimonials");
  if (!testimonialsSection || reduceMotion || typeof window.gsap === "undefined") return;

  let hasRun = false;

  const triggerTestimonials = () => {
    if (hasRun) return;
    hasRun = true;

    window.gsap.from(".testimonials-head > *", {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".testi-quotes-grid > *", {
      y: 22,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      delay: 0.12,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".testi-shot-frame", {
      y: 20,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      delay: 0.25,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".testi-checkout > *", {
      y: 16,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      delay: 0.38,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerTestimonials();
          observer.disconnect();
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    observer.observe(testimonialsSection);
  } else {
    triggerTestimonials();
  }
}

// Student Outputs section: entrance motion, smart viewport playback, and interactive controls
function initStudentOutputsMotion() {
  const section = document.getElementById("student-outputs");
  if (!section) return;

  const cards = section.querySelectorAll("[data-video-card]");
  const videos = section.querySelectorAll(".student-video");

  // Setup individual video controls & events
  cards.forEach((card) => {
    const video = card.querySelector(".student-video");
    const soundBtn = card.querySelector("[data-video-unmute]");
    const playBtn = card.querySelector("[data-video-play-toggle]");
    const soundIcon = soundBtn ? soundBtn.querySelector(".sound-icon") : null;

    if (!video) return;

    // Ensure muted initially
    video.muted = true;

    // Sound toggle
    if (soundBtn && soundIcon) {
      soundBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (video.muted) {
          // Mute all other student videos
          videos.forEach((otherVideo) => {
            if (otherVideo !== video) {
              otherVideo.muted = true;
              const otherCard = otherVideo.closest("[data-video-card]");
              const otherIcon = otherCard ? otherCard.querySelector(".sound-icon") : null;
              const otherBtn = otherCard ? otherCard.querySelector("[data-video-unmute]") : null;
              if (otherIcon) {
                otherIcon.classList.remove("sound-unmuted");
                otherIcon.classList.add("sound-muted");
              }
              if (otherBtn) {
                otherBtn.setAttribute("aria-label", "تشغيل الصوت");
              }
            }
          });

          video.muted = false;
          soundIcon.classList.remove("sound-muted");
          soundIcon.classList.add("sound-unmuted");
          soundBtn.setAttribute("aria-label", "كتم الصوت");

          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          video.muted = true;
          soundIcon.classList.remove("sound-unmuted");
          soundIcon.classList.add("sound-muted");
          soundBtn.setAttribute("aria-label", "تشغيل الصوت");
        }
      });
    }

    // Play/Pause toggle on video overlay
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }

    // Update card state on play/pause
    video.addEventListener("play", () => {
      card.classList.remove("is-paused");
    });
    video.addEventListener("pause", () => {
      card.classList.add("is-paused");
    });
  });

  // Smart Viewport Playback with IntersectionObserver
  if ("IntersectionObserver" in window) {
    const playbackObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!reduceMotion) {
            videos.forEach((vid) => {
              const attempt = vid.play();
              if (attempt && typeof attempt.catch === "function") {
                attempt.catch(() => {
                  vid.closest("[data-video-card]")?.classList.add("is-paused");
                });
              }
            });
          }
        } else {
          videos.forEach((vid) => {
            vid.pause();
          });
        }
      });
    }, { threshold: 0.15 });

    playbackObserver.observe(section);
  }

  // Entrance animations with GSAP
  if (reduceMotion || typeof window.gsap === "undefined") return;

  let hasRun = false;
  const triggerEntrance = () => {
    if (hasRun) return;
    hasRun = true;

    window.gsap.from(".student-outputs-head > *", {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".student-video-card", {
      y: 26,
      opacity: 0,
      duration: 0.75,
      stagger: 0.12,
      delay: 0.15,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });

    window.gsap.from(".student-outputs-checkout > *", {
      y: 16,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      delay: 0.35,
      ease: "power2.out",
      clearProps: "opacity,transform"
    });
  };

  if ("IntersectionObserver" in window) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerEntrance();
          animObserver.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

    animObserver.observe(section);
  } else {
    triggerEntrance();
  }
}