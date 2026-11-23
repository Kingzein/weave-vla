function bindSelection(selector, change) {
  const buttons = [...document.querySelectorAll(selector)];
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      for (const item of buttons) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      change(button);
    });
  }
}

const benchmarkControls = document.querySelector(".benchmark-controls");
const benchmarkTabs = [...benchmarkControls.querySelectorAll('[role="tab"]')];
const benchmarkPanels = benchmarkTabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

if (benchmarkPanels.every(Boolean)) {
  function selectBenchmark(index) {
    benchmarkTabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      benchmarkPanels[tabIndex].hidden = !selected;
    });
  }

  benchmarkTabs.forEach((tab, index) => {
    const panel = benchmarkPanels[index];
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", () => selectBenchmark(index));
    tab.addEventListener("keydown", (event) => {
      const count = benchmarkTabs.length;
      const nextIndex = {
        ArrowLeft: (index - 1 + count) % count,
        ArrowRight: (index + 1) % count,
        Home: 0,
        End: count - 1,
      }[event.key];
      if (nextIndex === undefined) return;
      event.preventDefault();
      selectBenchmark(nextIndex);
      benchmarkTabs[nextIndex].focus();
    });
  });

  selectBenchmark(0);
  benchmarkControls.hidden = false;
}

const videoCards = [...document.querySelectorAll("[data-task]")];

bindSelection("[data-condition]", (button) => {
  const condition = button.dataset.condition;
  const label = button.textContent.trim();
  for (const card of videoCards) {
    const video = card.querySelector("video");
    const path = `assets/rollouts/${condition}/${card.dataset.task}`;
    const title = card.querySelector("h3").textContent;
    video.pause();
    video.poster = `${path}.webp?v=2`;
    video.src = `${path}.mp4?v=2`;
    video.setAttribute("aria-label", `${title}, ${label.toLowerCase()} condition`);
    video.load();
    card.querySelector("[data-current-condition]").textContent = label;
  }
  document.querySelector("#condition-status").textContent = `Showing all three tasks under the ${label.toLowerCase()} condition.`;
});

const pageVideos = [...document.querySelectorAll("video")];
for (const video of pageVideos) {
  video.addEventListener("play", () => {
    for (const other of pageVideos) {
      if (other !== video) other.pause();
    }
  });
}

const copyButton = document.querySelector("#copy-citation");
const citation = document.querySelector("#bibtex");
const copyStatus = document.querySelector("#copy-status");
let copyReset;

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(citation.textContent);
    copyButton.textContent = "Copied";
    copyStatus.textContent = "BibTeX copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(citation);
    selection.removeAllRanges();
    selection.addRange(range);
    copyButton.textContent = "Citation selected";
    copyStatus.textContent = "Citation selected. Use your copy shortcut.";
  }
  clearTimeout(copyReset);
  copyReset = setTimeout(() => { copyButton.textContent = "Copy citation"; }, 2200);
});

const header = document.querySelector(".site-header");
const navigation = [...document.querySelectorAll(".main-nav a")].map((link) => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
}));
let activeLink = navigation.find(({ link }) => link.hasAttribute("aria-current"))?.link;
let navigationFrame = 0;

function updateNavigation() {
  navigationFrame = 0;
  const viewport = document.documentElement;
  const activationLine = header.getBoundingClientRect().bottom + Math.min(window.innerHeight * 0.16, 120);
  const scrolledToEnd = window.scrollY > 0 && viewport.scrollHeight - viewport.clientHeight - window.scrollY <= 2;
  const visibleSection = scrolledToEnd ? navigation.at(-1) : navigation.findLast(
    ({ section }) => section.getBoundingClientRect().top <= activationLine,
  );
  const nextLink = visibleSection?.link ?? navigation[0].link;
  if (nextLink === activeLink) return;
  activeLink?.removeAttribute("aria-current");
  nextLink.setAttribute("aria-current", "location");
  activeLink = nextLink;
}

function scheduleNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("pageshow", scheduleNavigationUpdate);
new ResizeObserver(scheduleNavigationUpdate).observe(document.querySelector("main"));
updateNavigation();
