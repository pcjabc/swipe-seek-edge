(function initSwipeSeekConstants(global) {
  "use strict";

  const STORAGE_KEY = "swipeSeekSettings";

  const DEFAULT_SETTINGS = {
    enabled: true,
    /** 滑满一屏宽度约等于视频总长的比例（0.1 ~ 1.0） */
    sensitivity: 0.35,
    /** 进入拖进度模式的最小横向位移（px） */
    activationThreshold: 10,
    /** 视频底部保留给原生控件的区域比例 */
    controlBarHeight: 0.15,
    /** 写入 currentTime 的最小间隔（ms），兼顾流畅与性能 */
    scrubThrottleMs: 48,
    /** 忽略过小视频（宽或高低于此值，px） */
    minVideoSize: 100,
    /** 进入 scrub 后是否暂停，便于预览帧 */
    pauseWhileScrubbing: true
  };

  global.SwipeSeek = global.SwipeSeek || {};
  global.SwipeSeek.STORAGE_KEY = STORAGE_KEY;
  global.SwipeSeek.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
})(typeof globalThis !== "undefined" ? globalThis : window);
