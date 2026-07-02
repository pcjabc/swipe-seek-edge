(function initSwipeSeekMain(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;
  const STORAGE_KEY = SwipeSeek.STORAGE_KEY;
  const DEFAULT_SETTINGS = SwipeSeek.DEFAULT_SETTINGS;

  /** @type {SwipeSeek.VideoDetector | null} */
  let detector = null;
  /** @type {SwipeSeek.ScrubOverlay | null} */
  let overlay = null;
  /** @type {typeof DEFAULT_SETTINGS} */
  let currentSettings = { ...DEFAULT_SETTINGS };

  function mergeSettings(stored) {
    return {
      ...DEFAULT_SETTINGS,
      ...(stored || {})
    };
  }

  function loadSettings(callback) {
    if (!global.chrome || !chrome.storage || !chrome.storage.sync) {
      callback(currentSettings);
      return;
    }

    chrome.storage.sync.get(STORAGE_KEY, function onLoaded(result) {
      currentSettings = mergeSettings(result[STORAGE_KEY]);
      callback(currentSettings);
    });
  }

  function applySettings(settings) {
    currentSettings = mergeSettings(settings);

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

    if (!detector) {
      detector = new SwipeSeek.VideoDetector(currentSettings, overlay);
      detector.start();
      return;
    }

    detector.updateSettings(currentSettings);
  }

  function bootstrap() {
    loadSettings(function onReady(settings) {
      applySettings(settings);
    });

    if (global.chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function onStorageChanged(changes, area) {
        if (area !== "sync" || !changes[STORAGE_KEY]) {
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
