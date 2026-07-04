const topbar = document.querySelector("[data-topbar]");
const canvas = document.querySelector("[data-ink-canvas]");
const ctx = canvas ? canvas.getContext("2d", { alpha: true }) : null;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const workList = document.querySelector("[data-work-list]");
const resultMeta = document.querySelector("[data-result-meta]");
const searchInput = document.querySelector("[data-search]");
const yearSelect = document.querySelector("[data-year]");
const filterButtons = document.querySelectorAll("[data-filter]");
const reader = document.querySelector("[data-reader]");
const readerTitle = document.querySelector("[data-reader-title]");
const readerMeta = document.querySelector("[data-reader-meta]");
const readerContent = document.querySelector("[data-reader-content]");
const readerClose = document.querySelector("[data-reader-close]");
let featureCards = Array.from(document.querySelectorAll("[data-open-work]"));

const MAX_VISIBLE_WORKS = 60;
const WORKS_LOAD_TIMEOUT = 4500;
const BLOCKED_KEYWORDS = [
  "性欲",
  "性爱",
  "色情",
  "自慰",
  "做爱",
  "性器",
  "阴茎",
  "阴道",
  "欲望",
  "中医",
  "针灸",
  "经络",
  "脉象",
  "肾虚",
  "中药",
  "艾灸",
  "气血"
];

let activeFilter = "all";
let usedFallbackArchive = false;
let animationFrame = null;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function workText(work) {
  return cleanText(`${work.title || ""} ${work.excerpt || ""} ${work.content || ""}`);
}

function hasBlockedTopic(work) {
  const text = workText(work).toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

function isSubstantialWork(work) {
  const content = cleanText(work.content || work.excerpt || "");
  const compactLength = content.replace(/\s/g, "").length;
  if (compactLength < 18) return false;
  if (!["诗", "短章"].includes(work.category) && compactLength < 45) return false;
  return true;
}

function isPublicWork(work) {
  return Boolean(work && work.id && work.title) && !hasBlockedTopic(work) && isSubstantialWork(work);
}

function cardToWork(card, index = 0) {
  const kindText = cleanText(card.querySelector(".piece-kind")?.textContent || "");
  const title = cleanText(card.querySelector("h3")?.textContent || "未题");
  const excerpt = cleanText(card.querySelector("p:last-child")?.textContent || "");
  const parts = kindText.split("·").map((part) => cleanText(part));
  const category = parts[0] || "散文";
  const date = parts[1] || "未署年";
  const yearMatch = date.match(/\d{4}/);

  return {
    id: card.dataset.openWork || `featured-${index}`,
    title,
    category,
    date,
    year: yearMatch ? yearMatch[0] : "未署年",
    excerpt,
    content: excerpt,
    charCount: excerpt.replace(/\s/g, "").length,
    featured: true
  };
}

function getFallbackWorks() {
  return Array.from(document.querySelectorAll("[data-open-work]"))
    .map(cardToWork)
    .filter(isPublicWork);
}

function getRawWorks() {
  if (Array.isArray(window.WORKS) && window.WORKS.length) return window.WORKS;
  usedFallbackArchive = true;
  return getFallbackWorks();
}

function getDisplayWorks() {
  return getRawWorks().filter(isPublicWork).slice(0, MAX_VISIBLE_WORKS);
}

function findWorkById(id) {
  return getDisplayWorks().find((work) => work.id === id) || getFallbackWorks().find((work) => work.id === id);
}

function pruneFeatureCards() {
  featureCards.forEach((card, index) => {
    if (!isPublicWork(cardToWork(card, index))) card.remove();
  });
  featureCards = Array.from(document.querySelectorAll("[data-open-work]"));
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawInk(time = 0) {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (prefersReducedMotion.matches) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const drift = time * 0.00008;
  ctx.globalAlpha = 0.22;

  for (let i = 0; i < 4; i += 1) {
    const y = height * (0.18 + i * 0.18);
    ctx.beginPath();
    ctx.moveTo(-80, y);
    for (let x = -80; x <= width + 80; x += 42) {
      const wave = Math.sin(x * 0.008 + drift * (i + 1) + i) * 18;
      ctx.lineTo(x, y + wave + Math.cos(drift + i) * 20);
    }
    ctx.strokeStyle = i % 2 ? "rgba(168, 70, 54, .22)" : "rgba(23, 65, 50, .18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  animationFrame = requestAnimationFrame(drawInk);
}

function setupReveal() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function updateTopbar() {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 20);
}

function populateYears() {
  if (!yearSelect) return;
  const currentValue = yearSelect.value || "all";
  const years = [...new Set(getDisplayWorks().map((work) => work.year).filter(Boolean))]
    .sort((a, b) => String(b).localeCompare(String(a), "zh-Hans"));

  yearSelect.innerHTML = '<option value="all">全部年份</option>';
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  yearSelect.value = years.includes(currentValue) ? currentValue : "all";
}

function filteredWorks() {
  const query = cleanText(searchInput?.value || "").toLowerCase();
  const year = yearSelect?.value || "all";

  return getDisplayWorks().filter((work) => {
    if (activeFilter !== "all" && work.category !== activeFilter) return false;
    if (year !== "all" && work.year !== year) return false;
    if (!query) return true;
    return workText(work).toLowerCase().includes(query);
  });
}

function renderWorks() {
  if (!workList) return;

  const displayWorks = getDisplayWorks();
  const works = filteredWorks();

  if (resultMeta) {
    const note = usedFallbackArchive ? "精选可读作品" : "精简收录";
    resultMeta.textContent = `当前显示 ${works.length} 篇 / ${note} ${displayWorks.length} 篇`;
  }

  if (!displayWorks.length) {
    workList.innerHTML = '<p class="empty-state">作品目录暂时没有载入成功，请稍后刷新。</p>';
    return;
  }

  if (!works.length) {
    workList.innerHTML = '<p class="empty-state">没有找到符合条件的作品。</p>';
    return;
  }

  workList.innerHTML = works
    .map(
      (work) => `
        <article class="work-card" role="button" tabindex="0" data-id="${escapeHtml(work.id)}">
          <p class="work-card__meta">${escapeHtml(work.category)} · ${escapeHtml(work.date || work.year || "未署年")}</p>
          <h3>${escapeHtml(work.title)}</h3>
          <p>${escapeHtml(work.excerpt || cleanText(work.content).slice(0, 80))}</p>
        </article>
      `
    )
    .join("");
}

function setReaderOpen(open) {
  if (!reader) return;
  reader.classList.toggle("is-open", open);
  reader.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.style.overflow = open ? "hidden" : "";
}

function openWork(id) {
  if (!reader || !readerTitle || !readerMeta || !readerContent) return;

  const work = findWorkById(id);
  if (!work) {
    readerMeta.textContent = "作品暂未载入";
    readerTitle.textContent = "这篇作品暂时打不开";
    readerContent.innerHTML = "<p>完整正文没有在这次轻量目录里载入。我已经让目录先保持可点击，之后可以继续恢复更多作品。</p>";
    setReaderOpen(true);
    return;
  }

  const content = String(work.content || work.excerpt || "正文暂未载入。").trim();
  const paragraphs = content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  readerMeta.textContent = `${work.category || "作品"} · ${work.date || work.year || "未署年"} · ${work.charCount || content.replace(/\s/g, "").length} 字`;
  readerTitle.textContent = work.title;
  readerContent.innerHTML = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
  setReaderOpen(true);
}

function closeReader() {
  setReaderOpen(false);
}

function activateFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  renderWorks();
}

function normalizeArchiveLabels() {
  const labels = {
    all: "全部",
    "散文": "散文",
    "诗": "诗",
    "短章": "短章",
    "英文": "英文",
    "小说片段": "片段"
  };

  document.querySelectorAll(".archive-counts [data-filter]").forEach((button) => {
    const label = labels[button.dataset.filter];
    if (label) button.textContent = label;
  });
}

function setupEvents() {
  window.addEventListener("scroll", updateTopbar, { passive: true });
  window.addEventListener("resize", resizeCanvas);

  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener("change", () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      drawInk();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateFilter(button.dataset.filter || "all");
      document.querySelector("#works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  searchInput?.addEventListener("input", renderWorks);
  yearSelect?.addEventListener("change", renderWorks);

  workList?.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (card) openWork(card.dataset.id);
  });

  workList?.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-id]");
    if (!card) return;
    event.preventDefault();
    openWork(card.dataset.id);
  });

  featureCards.forEach((card) => {
    card.addEventListener("click", () => openWork(card.dataset.openWork));
    card.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openWork(card.dataset.openWork);
    });
  });

  readerClose?.addEventListener("click", closeReader);
  reader?.addEventListener("click", (event) => {
    if (event.target === reader) closeReader();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reader?.classList.contains("is-open")) closeReader();
  });
}

async function waitForWorks() {
  if (!window.WORKS_READY || typeof window.WORKS_READY.then !== "function") return;

  await Promise.race([
    window.WORKS_READY,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("works-load-timeout")), WORKS_LOAD_TIMEOUT);
    })
  ]);
}

async function bootArchive() {
  try {
    await waitForWorks();
  } catch (error) {
    console.warn("作品目录加载较慢，已切换为轻量精选目录。", error);
    usedFallbackArchive = true;
    if (!Array.isArray(window.WORKS) || !window.WORKS.length) window.WORKS = getFallbackWorks();
  }

  if (!Array.isArray(window.WORKS) || !window.WORKS.length) {
    usedFallbackArchive = true;
    window.WORKS = getFallbackWorks();
  }

  populateYears();
  normalizeArchiveLabels();
  renderWorks();
}

pruneFeatureCards();
resizeCanvas();
setupReveal();
setupEvents();
updateTopbar();
drawInk();
bootArchive();
