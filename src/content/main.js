(function initSwipeSeekMain(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;
  const STORAGE_KEY = SwipeSeek.STORAGE_KEY;

  /** @type {SwipeSeek.VideoDetector | null} */
  let detector = null;
  /** @type {SwipeSeek.ScrubOverlay | null} */
  let overlay = null;
  /** @type {SwipeSeek.SettingsPanel | null} */
  let settingsPanel = null;
  let currentSettings = { ...SwipeSeek.DEFAULT_SETTINGS };
  let firstScrubHintPending = true;

  function applySettings(settings) {
    currentSettings = SwipeSeek.mergeSettings(settings);

    if (settingsPanel) {
      settingsPanel.updateSettings(currentSettings);
    }

    if (!currentSettings.enabled) {
      if (detector) {
        detector.stop();
        detector = null;
      }
      if (overlay) {
        overlay.hide();
      }
      return;
    }

    if (!overlay) {
      overlay = new SwipeSeek.ScrubOverlay();
    }

    if (!settingsPanel) {
      settingsPanel = new SwipeSeek.SettingsPanel(function onPanelChange(next) {
        applySettings(next);
      });
      settingsPanel.updateSettings(currentSettings);
    }

    if (!detector) {
      detector = new SwipeSeek.VideoDetector(currentSettings, overlay, {
        onTripleTap: function openPanel() {
          if (settingsPanel) {
            settingsPanel.open();
          }
        },
        onFirstScrub: function maybeHint() {
          if (!firstScrubHintPending || !settingsPanel) {
            return;
          }
          firstScrubHintPending = false;
          // 旧默认 0.35 的用户更可能觉得太快
          if (currentSettings.sensitivity >= 0.25) {
            settingsPanel.maybeShowHint();
          }
        }
      });
      detector.start();
      return;
    }

    detector.updateSettings(currentSettings);
  }

  function bootstrap() {
    SwipeSeek.loadSettings(function onReady(settings) {
      applySettings(settings);
    });

    if (global.chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function onStorageChanged(changes, area) {
        if ((area !== "local" && area !== "sync") || !changes[STORAGE_KEY]) {
          return;
        }
        applySettings(changes[STORAGE_KEY].newValue);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }

  global.addEventListener("pagehide", function onPageHide() {
    if (detector) {
      detector.stop();
      detector = null;
    }
    if (overlay) {
      overlay.destroy();
      overlay = null;
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
