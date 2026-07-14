"use strict";

const STORAGE_KEY = "swipeSeekSettings";

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 0.12,
  activationThreshold: 12,
  controlBarHeight: 0.15,
  scrubThrottleMs: 48,
  minVideoSize: 100,
  pauseWhileScrubbing: true
};

function writeDefaults(settings) {
  chrome.storage.local.set({ [STORAGE_KEY]: settings });
  chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

chrome.runtime.onInstalled.addListener(function onInstalled(details) {
  if (details.reason === "install") {
    writeDefaults(DEFAULT_SETTINGS);
    return;
  }

  if (details.reason !== "update") {
    return;
  }

  // 旧默认 0.35 对手机太快：升级时自动改成更慢的默认值
  chrome.storage.local.get(STORAGE_KEY, function onLocal(localResult) {
    chrome.storage.sync.get(STORAGE_KEY, function onSync(syncResult) {
      const current =
        (localResult && localResult[STORAGE_KEY]) ||
        (syncResult && syncResult[STORAGE_KEY]) ||
        null;

      if (!current) {
        writeDefaults(DEFAULT_SETTINGS);
        return;
      }

      const next = { ...DEFAULT_SETTINGS, ...current };
      if (typeof current.sensitivity !== "number" || current.sensitivity >= 0.3) {
        next.sensitivity = DEFAULT_SETTINGS.sensitivity;
      }
      writeDefaults(next);
    });
  });
});
