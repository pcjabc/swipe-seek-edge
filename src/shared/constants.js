(function initSwipeSeekConstants(global) {
  "use strict";

  const STORAGE_KEY = "swipeSeekSettings";

  const DEFAULT_SETTINGS = {
    enabled: true,
    /** 滑满一屏宽度约等于视频总长的比例（越小越慢） */
    sensitivity: 0.12,
    /** 进入拖进度模式的最小横向位移（px） */
    activationThreshold: 12,
    /** 视频底部保留给原生控件的区域比例 */
    controlBarHeight: 0.15,
    /** 写入 currentTime 的最小间隔（ms） */
    scrubThrottleMs: 48,
    /** 忽略过小视频（宽或高低于此值，px） */
    minVideoSize: 100,
    /** 进入 scrub 后是否暂停，便于预览帧 */
    pauseWhileScrubbing: true
  };

  const SENSITIVITY_PRESETS = [
    { id: "slow", label: "慢", value: 0.06 },
    { id: "medium", label: "适中", value: 0.12 },
    { id: "fast", label: "快", value: 0.2 },
    { id: "faster", label: "很快", value: 0.35 }
  ];

  function mergeSettings(stored) {
    return {
      ...DEFAULT_SETTINGS,
      ...(stored || {})
    };
  }

  function loadSettings(callback) {
    if (!global.chrome || !chrome.storage) {
      callback({ ...DEFAULT_SETTINGS });
      return;
    }

    const finish = function finish(raw) {
      callback(mergeSettings(raw));
    };

    // 手机上 local 更可靠；没有再读 sync
    chrome.storage.local.get(STORAGE_KEY, function onLocal(localResult) {
      if (localResult && localResult[STORAGE_KEY]) {
        finish(localResult[STORAGE_KEY]);
        return;
      }
      if (!chrome.storage.sync) {
        finish(null);
        return;
      }
      chrome.storage.sync.get(STORAGE_KEY, function onSync(syncResult) {
        finish(syncResult && syncResult[STORAGE_KEY]);
      });
    });
  }

  function saveSettings(settings, callback) {
    const payload = { [STORAGE_KEY]: mergeSettings(settings) };
    let pending = 0;

    function done() {
      pending -= 1;
      if (pending <= 0 && typeof callback === "function") {
        callback();
      }
    }

    if (!global.chrome || !chrome.storage) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    pending += 1;
    chrome.storage.local.set(payload, done);

    if (chrome.storage.sync) {
      pending += 1;
      chrome.storage.sync.set(payload, done);
    }
  }

  global.SwipeSeek = global.SwipeSeek || {};
  global.SwipeSeek.STORAGE_KEY = STORAGE_KEY;
  global.SwipeSeek.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  global.SwipeSeek.SENSITIVITY_PRESETS = SENSITIVITY_PRESETS;
  global.SwipeSeek.mergeSettings = mergeSettings;
  global.SwipeSeek.loadSettings = loadSettings;
  global.SwipeSeek.saveSettings = saveSettings;
})(typeof globalThis !== "undefined" ? globalThis : window);
