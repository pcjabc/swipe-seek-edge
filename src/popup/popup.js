"use strict";

const STORAGE_KEY = "swipeSeekSettings";

const enabledInput = document.getElementById("enabled");
const pageStateEl = document.getElementById("page-state");
const openOptionsLink = document.getElementById("open-options");

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 0.12,
  activationThreshold: 12,
  controlBarHeight: 0.15,
  scrubThrottleMs: 48,
  minVideoSize: 100,
  pauseWhileScrubbing: true
};

function persist(settings) {
  const payload = { [STORAGE_KEY]: settings };
  chrome.storage.local.set(payload);
  chrome.storage.sync.set(payload);
}

function loadEnabledState() {
  chrome.storage.local.get(STORAGE_KEY, function onLocal(localResult) {
    const local = localResult[STORAGE_KEY];
    if (local) {
      enabledInput.checked = local.enabled !== false;
      return;
    }
    chrome.storage.sync.get(STORAGE_KEY, function onSync(result) {
      const settings = result[STORAGE_KEY] || { enabled: true };
      enabledInput.checked = settings.enabled !== false;
    });
  });
}

function saveEnabledState(enabled) {
  chrome.storage.local.get(STORAGE_KEY, function onLocal(localResult) {
    chrome.storage.sync.get(STORAGE_KEY, function onSync(syncResult) {
      const settings = {
        ...DEFAULT_SETTINGS,
        ...(syncResult[STORAGE_KEY] || {}),
        ...(localResult[STORAGE_KEY] || {}),
        enabled: enabled
      };
      persist(settings);
    });
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
          pageStateEl.textContent =
            "检测到 " + total + " 个 video；连点视频三次可调灵敏度";
        } else {
          pageStateEl.textContent =
            "未检测到 video 标签（自定义播放器站点可能不支持）";
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
