(function initSwipeSeekSettingsPanel(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;

  class SettingsPanel {
    constructor(onChange) {
      this.onChange = onChange;
      this.settings = { ...SwipeSeek.DEFAULT_SETTINGS };
      this.root = null;
      this.hintShown = false;
    }

    updateSettings(settings) {
      this.settings = SwipeSeek.mergeSettings(settings);
      this.renderValues();
    }

    ensureMounted() {
      if (this.root) {
        return;
      }

      const root = document.createElement("div");
      root.id = "swipe-seek-settings-panel";
      root.setAttribute("data-swipe-seek-ui", "settings");
      root.innerHTML = [
        '<div class="swipe-seek-settings__card">',
        '  <div class="swipe-seek-settings__title">灵敏度设置</div>',
        '  <div class="swipe-seek-settings__hint">连点视频三次打开此面板</div>',
        '  <div class="swipe-seek-settings__presets"></div>',
        '  <label class="swipe-seek-settings__row">',
        '    <span>自定义</span>',
        '    <output class="swipe-seek-settings__value">12%</output>',
        "  </label>",
        '  <input class="swipe-seek-settings__range" type="range" min="4" max="40" step="1" value="12" />',
        '  <div class="swipe-seek-settings__actions">',
        '    <button type="button" class="swipe-seek-settings__btn" data-action="close">关闭</button>',
        "  </div>",
        "</div>"
      ].join("");

      const style = document.createElement("style");
      style.textContent = [
        "#swipe-seek-settings-panel {",
        "  position: fixed; inset: 0; z-index: 2147483647;",
        "  display: none; align-items: flex-end; justify-content: center;",
        "  background: rgba(0,0,0,0.45); padding: 16px;",
        "  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
        "}",
        "#swipe-seek-settings-panel.is-visible { display: flex; }",
        ".swipe-seek-settings__card {",
        "  width: min(420px, 100%);",
        "  background: #1c1c1e; color: #fff; border-radius: 16px;",
        "  padding: 16px 16px 18px; box-shadow: 0 12px 40px rgba(0,0,0,0.4);",
        "}",
        ".swipe-seek-settings__title { font-size: 17px; font-weight: 700; }",
        ".swipe-seek-settings__hint { margin-top: 4px; font-size: 12px; opacity: 0.7; }",
        ".swipe-seek-settings__presets {",
        "  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0 12px;",
        "}",
        ".swipe-seek-settings__preset {",
        "  border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #fff;",
        "  border-radius: 10px; padding: 10px 0; font-size: 14px;",
        "}",
        ".swipe-seek-settings__preset.is-active {",
        "  background: #0078d4; border-color: #0078d4;",
        "}",
        ".swipe-seek-settings__row {",
        "  display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;",
        "}",
        ".swipe-seek-settings__range { width: 100%; }",
        ".swipe-seek-settings__actions { margin-top: 14px; display: flex; justify-content: flex-end; }",
        ".swipe-seek-settings__btn {",
        "  border: 0; background: #3a3a3c; color: #fff; border-radius: 10px;",
        "  padding: 10px 16px; font-size: 14px;",
        "}",
        "#swipe-seek-settings-toast {",
        "  position: fixed; left: 50%; bottom: 24%; transform: translateX(-50%);",
        "  z-index: 2147483645; pointer-events: none;",
        "  background: rgba(0,0,0,0.75); color: #fff; border-radius: 999px;",
        "  padding: 8px 14px; font-size: 13px; opacity: 0; transition: opacity 160ms ease;",
        "  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
        "}",
        "#swipe-seek-settings-toast.is-visible { opacity: 1; }"
      ].join("\n");

      document.documentElement.appendChild(style);
      (document.body || document.documentElement).appendChild(root);

      this.root = root;
      this.presetsEl = root.querySelector(".swipe-seek-settings__presets");
      this.rangeEl = root.querySelector(".swipe-seek-settings__range");
      this.valueEl = root.querySelector(".swipe-seek-settings__value");

      SwipeSeek.SENSITIVITY_PRESETS.forEach((preset) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swipe-seek-settings__preset";
        btn.dataset.preset = preset.id;
        btn.dataset.value = String(preset.value);
        btn.textContent = preset.label;
        btn.addEventListener("click", () => {
          this.applySensitivity(preset.value);
        });
        this.presetsEl.appendChild(btn);
      });

      this.rangeEl.addEventListener("input", () => {
        const percent = Number(this.rangeEl.value);
        this.applySensitivity(percent / 100, false);
      });

      root.querySelector('[data-action="close"]').addEventListener("click", () => {
        this.hide();
      });

      root.addEventListener("click", (event) => {
        if (event.target === root) {
          this.hide();
        }
      });

      this.renderValues();
    }

    open() {
      this.ensureMounted();
      this.renderValues();
      this.root.classList.add("is-visible");
    }

    hide() {
      if (this.root) {
        this.root.classList.remove("is-visible");
      }
    }

    applySensitivity(value, persist) {
      const next = SwipeSeek.mergeSettings({
        ...this.settings,
        sensitivity: clamp(value, 0.04, 0.4)
      });
      this.settings = next;
      this.renderValues();
      if (persist !== false) {
        SwipeSeek.saveSettings(next);
      } else {
        // 拖滑条时边改边存（节流交给 storage）
        SwipeSeek.saveSettings(next);
      }
      if (typeof this.onChange === "function") {
        this.onChange(next);
      }
    }

    renderValues() {
      if (!this.root) {
        return;
      }
      const percent = Math.round(this.settings.sensitivity * 100);
      this.rangeEl.value = String(percent);
      this.valueEl.textContent = percent + "%";

      const buttons = this.presetsEl.querySelectorAll(".swipe-seek-settings__preset");
      buttons.forEach((btn) => {
        const active =
          Math.abs(Number(btn.dataset.value) - this.settings.sensitivity) < 0.005;
        btn.classList.toggle("is-active", active);
      });
    }

    showToast(message) {
      let toast = document.getElementById("swipe-seek-settings-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "swipe-seek-settings-toast";
        (document.body || document.documentElement).appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(this._toastTimer);
      this._toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2200);
    }

    maybeShowHint() {
      if (this.hintShown) {
        return;
      }
      this.hintShown = true;
      this.showToast("太快了？连点视频三次调灵敏度");
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  SwipeSeek.SettingsPanel = SettingsPanel;
})(typeof globalThis !== "undefined" ? globalThis : window);
