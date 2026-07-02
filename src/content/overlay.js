(function initSwipeSeekOverlay(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;

  class ScrubOverlay {
    constructor() {
      this.root = null;
      this.deltaEl = null;
      this.timeEl = null;
      this.barFill = null;
    }

    ensureMounted() {
      if (this.root) {
        return;
      }

      const root = document.createElement("div");
      root.id = "swipe-seek-overlay-root";
      root.setAttribute("data-swipe-seek-ui", "overlay");
      root.innerHTML = [
        '<div class="swipe-seek-overlay__panel">',
        '  <div class="swipe-seek-overlay__delta">+0:00</div>',
        '  <div class="swipe-seek-overlay__time">0:00 / 0:00</div>',
        '  <div class="swipe-seek-overlay__bar"><div class="swipe-seek-overlay__bar-fill"></div></div>',
        "</div>"
      ].join("");

      const style = document.createElement("style");
      style.textContent = [
        "#swipe-seek-overlay-root {",
        "  position: fixed;",
        "  inset: 0;",
        "  z-index: 2147483646;",
        "  pointer-events: none;",
        "  display: none;",
        "  align-items: center;",
        "  justify-content: center;",
        "  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
        "}",
        "#swipe-seek-overlay-root.is-visible { display: flex; }",
        ".swipe-seek-overlay__panel {",
        "  min-width: 168px;",
        "  padding: 14px 18px;",
        "  border-radius: 14px;",
        "  background: rgba(0, 0, 0, 0.72);",
        "  color: #fff;",
        "  text-align: center;",
        "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);",
        "  backdrop-filter: blur(8px);",
        "  -webkit-backdrop-filter: blur(8px);",
        "}",
        ".swipe-seek-overlay__delta {",
        "  font-size: 28px;",
        "  font-weight: 700;",
        "  letter-spacing: 0.02em;",
        "  line-height: 1.2;",
        "}",
        ".swipe-seek-overlay__delta.is-negative { color: #ff8a80; }",
        ".swipe-seek-overlay__delta.is-positive { color: #69f0ae; }",
        ".swipe-seek-overlay__time {",
        "  margin-top: 6px;",
        "  font-size: 13px;",
        "  opacity: 0.88;",
        "}",
        ".swipe-seek-overlay__bar {",
        "  margin-top: 10px;",
        "  height: 4px;",
        "  border-radius: 999px;",
        "  background: rgba(255, 255, 255, 0.25);",
        "  overflow: hidden;",
        "}",
        ".swipe-seek-overlay__bar-fill {",
        "  height: 100%;",
        "  width: 0%;",
        "  background: #42a5f5;",
        "  border-radius: inherit;",
        "  transition: width 40ms linear;",
        "}"
      ].join("\n");

      document.documentElement.appendChild(style);
      (document.body || document.documentElement).appendChild(root);

      this.root = root;
      this.deltaEl = root.querySelector(".swipe-seek-overlay__delta");
      this.timeEl = root.querySelector(".swipe-seek-overlay__time");
      this.barFill = root.querySelector(".swipe-seek-overlay__bar-fill");
    }

    show({ deltaSeconds, currentSeconds, durationSeconds }) {
      this.ensureMounted();

      const sign = deltaSeconds >= 0 ? "+" : "-";
      const absDelta = Math.abs(deltaSeconds);
      this.deltaEl.textContent = sign + formatClock(absDelta);
      this.deltaEl.classList.toggle("is-negative", deltaSeconds < 0);
      this.deltaEl.classList.toggle("is-positive", deltaSeconds > 0);
      this.deltaEl.classList.toggle("is-neutral", deltaSeconds === 0);

      this.timeEl.textContent =
        formatClock(currentSeconds) + " / " + formatClock(durationSeconds);

      const ratio =
        durationSeconds > 0 ? (currentSeconds / durationSeconds) * 100 : 0;
      this.barFill.style.width = clamp(ratio, 0, 100) + "%";

      this.root.classList.add("is-visible");
    }

    hide() {
      if (this.root) {
        this.root.classList.remove("is-visible");
      }
    }

    destroy() {
      this.hide();
      if (this.root) {
        this.root.remove();
        this.root = null;
      }
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatClock(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
      return "0:00";
    }

    const whole = Math.floor(totalSeconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;

    if (hours > 0) {
      return (
        hours +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
      );
    }

    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  SwipeSeek.ScrubOverlay = ScrubOverlay;
  SwipeSeek.formatClock = formatClock;
})(typeof globalThis !== "undefined" ? globalThis : window);
