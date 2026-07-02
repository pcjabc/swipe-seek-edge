"use strict";

const STORAGE_KEY = "swipeSeekSettings";

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 0.35,
  activationThreshold: 10,
  controlBarHeight: 0.15,
  scrubThrottleMs: 48,
  minVideoSize: 100,
  pauseWhileScrubbing: true
};

chrome.runtime.onInstalled.addListener(function onInstalled(details) {
  if (details.reason !== "install") {
    return;
  }

  chrome.storage.sync.get(STORAGE_KEY, function onLoaded(existing) {
    if (existing[STORAGE_KEY]) {
      return;
    }
    chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  });
});
