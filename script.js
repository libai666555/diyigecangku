const topbar = document.querySelector("[data-topbar]");
const canvas = document.querySelector("[data-hero-canvas]");
const ctx = canvas.getContext("2d", { alpha: true });
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const pointer = {
  x: 0.5,
  y: 0.5,
  active: false,
};

let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;
let rafId = 0;

const palette = [
  [246, 196, 111],
  [15, 111, 92],
  [41, 76, 155],
  [216, 91, 69],
];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawRibbon(time, index, color) {
  const rows = 7 + index;
  const amplitude = height * (0.035 + index * 0.005);
  const yBase = height * (0.22 + index * 0.16);
  const mousePull = pointer.active ? (pointer.y - 0.5) * 44 : 0;

  ctx.beginPath();
  for (let i = 0; i <= rows; i += 1) {
    const y = yBase + i * 24 + mousePull;
    for (let x = -40; x <= width + 40; x += 22) {
      const phase = x * 0.01 + time * (0.00055 + index * 0.00014) + i * 0.72;
      const px = x;
      const py =
        y +
        Math.sin(phase) * amplitude +
        Math.cos(phase * 0.62 + index) * amplitude * 0.45;

      if (x === -40) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
  }

  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.2 - index * 0.025})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPanels(time) {
  const drift = Math.sin(time * 0.00035) * 18;
  const pullX = pointer.active ? (pointer.x - 0.5) * 34 : 0;
  const pullY = pointer.active ? (pointer.y - 0.5) * 26 : 0;

  const panels = [
    {
      x: width * 0.62 + pullX,
      y: height * 0.16 + pullY,
      w: width * 0.24,
      h: height * 0.34,
      color: "rgba(246, 196, 111, 0.12)",
    },
    {
      x: width * 0.72 - drift + pullX * 0.3,
      y: height * 0.52 + pullY * 0.5,
      w: width * 0.18,
      h: height * 0.22,
      color: "rgba(216, 91, 69, 0.14)",
    },
    {
      x: width * 0.44 + drift * 0.6,
      y: height * 0.34 - pullY * 0.24,
      w: width * 0.17,
      h: height * 0.28,
      color: "rgba(15, 111, 92, 0.15)",
    },
  ];

  panels.forEach((panel, index) => {
    ctx.save();
    ctx.translate(panel.x, panel.y);
    ctx.rotate((index - 1) * 0.08 + Math.sin(time * 0.00025 + index) * 0.025);
    ctx.fillStyle = panel.color;
    ctx.strokeStyle = "rgba(255, 253, 248, 0.22)";
    ctx.lineWidth = 1;
    ctx.fillRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
    ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
    ctx.restore();
  });
}

function drawField(time) {
  ctx.clearRect(0, 0, width, height);

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#10100e");
  base.addColorStop(0.42, "#17231f");
  base.addColorStop(0.72, "#1b1c2a");
  base.addColorStop(1, "#11100f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * (0.62 + (pointer.x - 0.5) * 0.1),
    height * (0.36 + (pointer.y - 0.5) * 0.08),
    40,
    width * 0.58,
    height * 0.36,
    Math.max(width, height) * 0.8,
  );
  glow.addColorStop(0, "rgba(246, 196, 111, 0.18)");
  glow.addColorStop(0.38, "rgba(15, 111, 92, 0.12)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  drawPanels(time);

  palette.forEach((color, index) => {
    drawRibbon(time, index, color);
  });

  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.strokeStyle = "rgba(255, 253, 248, 0.16)";
  ctx.lineWidth = 1;
  for (let x = -60; x < width + 80; x += 72) {
    const shift = Math.sin(time * 0.00022 + x * 0.01) * 18;
    ctx.beginPath();
    ctx.moveTo(x + shift, 0);
    ctx.lineTo(x + shift + height * 0.28, height);
    ctx.stroke();
  }
  ctx.restore();
}

function animate(time = 0) {
  frame = time;
  drawField(frame);
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
    item.style.transitionDelay = `${Math.min(index * 42, 260)}ms`;
    observer.observe(item);
  });
}

function setupCards() {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-5px) rotateX(${y * -3}deg) rotateY(${x * 4}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  drawField(frame);
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
setupCards();
animate();
