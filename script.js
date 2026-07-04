const topbar = document.querySelector("[data-topbar]");
const canvas = document.querySelector("[data-ink-canvas]");
const ctx = canvas.getContext("2d", { alpha: true });
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const pointer = {
  x: 0.52,
  y: 0.42,
  active: false,
};

let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;
let rafId = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawMountain(points, color, alpha) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], height);
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(points[points.length - 1][0], height);
  ctx.closePath();
  ctx.fillStyle = color.replace("ALPHA", alpha);
  ctx.fill();
}

function drawMist(time) {
  ctx.save();
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i += 1) {
    const y = height * (0.22 + i * 0.07);
    const drift = Math.sin(time * 0.00024 + i) * 26;
    const grad = ctx.createLinearGradient(0, y, width, y);
    grad.addColorStop(0, "rgba(255, 252, 244, 0)");
    grad.addColorStop(0.22, "rgba(255, 252, 244, 0.22)");
    grad.addColorStop(0.72, "rgba(255, 252, 244, 0.16)");
    grad.addColorStop(1, "rgba(255, 252, 244, 0)");
    ctx.strokeStyle = grad;
    ctx.beginPath();
    for (let x = -60; x <= width + 60; x += 34) {
      const wave = Math.sin(x * 0.012 + time * 0.0005 + i) * 8;
      if (x === -60) {
        ctx.moveTo(x + drift, y + wave);
      } else {
        ctx.lineTo(x + drift, y + wave);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawInkDrops(time) {
  ctx.save();
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const x = ((i * 97) % 1000) / 1000 * width;
    const baseY = ((i * 181) % 1000) / 1000 * height;
    const y = baseY + Math.sin(time * 0.00028 + i) * 10;
    const r = 1.2 + (i % 5) * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 252, 244, ${0.045 + (i % 4) * 0.012})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawScene(time) {
  ctx.clearRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#17201b");
  sky.addColorStop(0.48, "#243c33");
  sky.addColorStop(1, "#0f1512");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const pullX = pointer.active ? (pointer.x - 0.5) * 28 : 0;
  const pullY = pointer.active ? (pointer.y - 0.5) * 18 : 0;

  const moonX = width * 0.72 + pullX * 0.4;
  const moonY = height * 0.22 + pullY * 0.2;
  const moonR = Math.max(44, Math.min(width, height) * 0.08);
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, moonR * 2.8);
  moonGlow.addColorStop(0, "rgba(232, 215, 173, 0.62)");
  moonGlow.addColorStop(0.26, "rgba(232, 215, 173, 0.18)");
  moonGlow.addColorStop(1, "rgba(232, 215, 173, 0)");
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(232, 215, 173, 0.78)";
  ctx.fill();

  const far = [
    [-40, height * 0.78],
    [width * 0.12, height * 0.52 + pullY * 0.3],
    [width * 0.28, height * 0.64],
    [width * 0.42, height * 0.46 + pullY * 0.2],
    [width * 0.62, height * 0.62],
    [width * 0.78, height * 0.42 - pullY * 0.2],
    [width + 40, height * 0.7],
  ];
  const near = [
    [-40, height * 0.9],
    [width * 0.16, height * 0.65 + pullY * 0.2],
    [width * 0.34, height * 0.76],
    [width * 0.52, height * 0.57],
    [width * 0.68, height * 0.72],
    [width * 0.86, height * 0.54 - pullY * 0.2],
    [width + 40, height * 0.82],
  ];

  drawMountain(far, "rgba(8, 15, 12, ALPHA)", 0.42);
  drawMist(time);
  drawMountain(near, "rgba(8, 15, 12, ALPHA)", 0.64);

  ctx.save();
  ctx.strokeStyle = "rgba(232, 215, 173, 0.12)";
  ctx.lineWidth = 1;
  for (let x = -90; x < width + 120; x += 84) {
    const lean = Math.sin(time * 0.00018 + x) * 14;
    ctx.beginPath();
    ctx.moveTo(x + lean, height * 0.08);
    ctx.lineTo(x + height * 0.2 + lean, height);
    ctx.stroke();
  }
  ctx.restore();

  drawInkDrops(time);
}

function animate(time = 0) {
  frame = time;
  drawScene(frame);
  if (!prefersReducedMotion.matches) {
    rafId = requestAnimationFrame(animate);
  }
}

function handleScroll() {
  topbar.classList.toggle("is-scrolled", window.scrollY > 18);
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" },
  );

  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 36, 220)}ms`;
    observer.observe(item);
  });
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  drawScene(frame);
});

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / Math.max(1, window.innerWidth);
  pointer.y = event.clientY / Math.max(1, window.innerHeight);
  pointer.active = true;
});

window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

prefersReducedMotion.addEventListener("change", () => {
  cancelAnimationFrame(rafId);
  animate(frame);
});

resizeCanvas();
handleScroll();
setupReveal();
animate();
