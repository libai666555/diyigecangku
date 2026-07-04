const topbar = document.querySelector("[data-topbar]");
const canvas = document.querySelector("[data-ink-canvas]");
const ctx = canvas.getContext("2d", { alpha: true });
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const workList = document.querySelector("[data-work-list]");
const resultMeta = document.querySelector("[data-result-meta]");
const searchInput = document.querySelector("[data-search]");
const yearSelect = document.querySelector("[data-year]");
const filterButtons = document.querySelectorAll("[data-filter]");
const reader = document.querySelector("[data-reader]");
const readerClose = document.querySelector("[data-reader-close]");
const readerMeta = document.querySelector("[data-reader-meta]");
const readerTitle = document.querySelector("[data-reader-title]");
const readerContent = document.querySelector("[data-reader-content]");
const featureCards = document.querySelectorAll("[data-open-work]");

let activeFilter = "all";
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

function drawScene(time = 0) {
  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#17201b");
  sky.addColorStop(0.48, "#243c33");
  sky.addColorStop(1, "#0f1512");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const moonX = width * 0.72;
  const moonY = height * 0.22;
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
    [width * 0.12, height * 0.52],
    [width * 0.28, height * 0.64],
    [width * 0.42, height * 0.46],
    [width * 0.62, height * 0.62],
    [width * 0.78, height * 0.42],
    [width + 40, height * 0.7],
  ];
  const near = [
    [-40, height * 0.9],
    [width * 0.16, height * 0.65],
    [width * 0.34, height * 0.76],
    [width * 0.52, height * 0.57],
    [width * 0.68, height * 0.72],
    [width * 0.86, height * 0.54],
    [width + 40, height * 0.82],
  ];
  drawMountain(far, "rgba(8, 15, 12, ALPHA)", 0.42);
  drawMountain(near, "rgba(8, 15, 12, ALPHA)", 0.64);

  ctx.save();
  ctx.globalAlpha = 0.32;
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
      if (x === -60) ctx.moveTo(x + drift, y + wave);
      else ctx.lineTo(x + drift, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function animate(time = 0) {
  frame = time;
  drawScene(frame);
  if (!prefersReducedMotion.matches) rafId = requestAnimationFrame(animate);
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

function handleScroll() {
  topbar.classList.toggle("is-scrolled", window.scrollY > 18);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filteredWorks() {
  const query = searchInput.value.trim().toLowerCase();
  const year = yearSelect.value;
  const allWorks = window.WORKS || [];
  return allWorks.filter((work) => {
    if (activeFilter !== "all" && work.category !== activeFilter) return false;
    if (year !== "all" && work.year !== year) return false;
    if (!query) return true;
    return `${work.title} ${work.excerpt} ${work.content}`.toLowerCase().includes(query);
  });
}

function renderWorks() {
  const allWorks = window.WORKS || [];
  if (!allWorks.length) {
    resultMeta.textContent = "作品目录载入中...";
    workList.innerHTML = '<p class="empty-state">作品目录载入中，请稍候。</p>';
    return;
  }
  const works = filteredWorks();
  resultMeta.textContent = `当前显示 ${works.length} 篇 / 共 ${allWorks.length} 篇`;
  workList.innerHTML = works
    .map(
      (work) => `
        <article class="work-card" data-id="${escapeHtml(work.id)}" tabindex="0" role="button" aria-label="阅读《${escapeHtml(work.title)}》">
          <span class="kind">${escapeHtml(work.category)}</span>
          <div>
            <h3>${escapeHtml(work.title)}</h3>
            <p>${escapeHtml(work.excerpt)}</p>
          </div>
          <span class="date">${escapeHtml(work.date || work.year)}</span>
        </article>
      `,
    )
    .join("");
}

function openWork(id) {
  const work = (window.WORKS || []).find((item) => item.id === id);
  if (!work) return;
  readerMeta.textContent = `${work.category} · ${work.date || work.year} · ${work.charCount} 字`;
  readerTitle.textContent = work.title;
  readerContent.innerHTML = work.content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  reader.classList.add("is-open");
  reader.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeReader() {
  reader.classList.remove("is-open");
  reader.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  drawScene(frame);
});
prefersReducedMotion.addEventListener("change", () => {
  cancelAnimationFrame(rafId);
  animate(frame);
});
searchInput.addEventListener("input", renderWorks);
yearSelect.addEventListener("change", renderWorks);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;
    activeFilter = selectedFilter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.filter === selectedFilter));
    renderWorks();
  });
});
workList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card) openWork(card.dataset.id);
});
workList.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const card = event.target.closest("[data-id]");
    if (card) openWork(card.dataset.id);
  }
});
featureCards.forEach((card) => card.addEventListener("click", () => openWork(card.dataset.openWork)));
readerClose.addEventListener("click", closeReader);
reader.addEventListener("click", (event) => {
  if (event.target === reader) closeReader();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeReader();
});

async function bootArchive() {
  try {
    if (window.WORKS_READY) await window.WORKS_READY;
    if (!Array.isArray(window.WORKS)) window.WORKS = [];
    renderWorks();
  } catch (error) {
    console.error(error);
    resultMeta.textContent = "作品目录加载失败";
    workList.innerHTML = '<p class="empty-state">作品目录没有加载成功，请刷新页面再试。</p>';
  }
}

resizeCanvas();
handleScroll();
setupReveal();
bootArchive();
animate();
