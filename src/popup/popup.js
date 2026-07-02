"use strict";

const STORAGE_KEY = "swipeSeekSettings";

const enabledInput = document.getElementById("enabled");
const pageStateEl = document.getElementById("page-state");
const openOptionsLink = document.getElementById("open-options");

function loadEnabledState() {
  chrome.storage.sync.get(STORAGE_KEY, function onLoad(result) {
    const settings = result[STORAGE_KEY] || { enabled: true };
    enabledInput.checked = settings.enabled !== false;
  });
}

function saveEnabledState(enabled) {
  chrome.storage.sync.get(STORAGE_KEY, function onLoad(result) {
    const settings = {
      enabled: true,
      sensitivity: 0.35,
      activationThreshold: 10,
      controlBarHeight: 0.15,
      scrubThrottleMs: 48,
      minVideoSize: 100,
      pauseWhileScrubbing: true,
      ...(result[STORAGE_KEY] || {})
    };
    settings.enabled = enabled;
    chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  });
}

function inspectActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function onTabs(tabs) {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      pageStateEl.textContent = "无法获取当前标签页";
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id, allFrames: true },
        func: function countVideos() {
          return document.querySelectorAll("video").length;
        }
      },
      function onResult(results) {
        if (chrome.runtime.lastError) {
          pageStateEl.textContent = "当前页面无法检测（可能受权限限制）";
          return;
        }

        const total = (results || []).reduce(function sum(acc, item) {
          return acc + (item.result || 0);
        }, 0);

        if (total > 0) {
          pageStateEl.textContent = "检测到 " + total + " 个 video，可尝试滑动";
        } else {
          pageStateEl.textContent = "未检测到 video 标签（自定义播放器站点可能不支持）";
        }
      }
    );
  });
}

enabledInput.addEventListener("change", function onToggle() {
  saveEnabledState(enabledInput.checked);
});

openOptionsLink.addEventListener("click", function onOpenOptions(event) {
  event.preventDefault();
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});

loadEnabledState();
inspectActiveTab();
