(function initSwipeSeekVideoDetector(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;

  class VideoDetector {
    constructor(settings, overlay, options) {
      this.settings = settings;
      this.overlay = overlay;
      this.options = options || {};
      /** @type {Map<HTMLVideoElement, SwipeSeek.GestureController>} */
      this.controllers = new Map();
      this.observer = null;
    }

    start() {
      this.scan();
      this.observer = new MutationObserver(this.handleMutations.bind(this));
      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      for (const controller of this.controllers.values()) {
        controller.detach();
      }
      this.controllers.clear();
    }

    updateSettings(settings) {
      this.settings = settings;
      for (const controller of this.controllers.values()) {
        controller.updateSettings(settings);
      }
    }

    handleMutations(mutations) {
      let needsScan = false;

      for (const mutation of mutations) {
        if (mutation.type !== "childList") {
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }
          if (node instanceof HTMLVideoElement || node.querySelector("video")) {
            needsScan = true;
            break;
          }
        }

        if (needsScan) {
          break;
        }
      }

      if (needsScan) {
        this.scan();
      }
    }

    scan() {
      const videos = document.querySelectorAll("video");
      const seen = new Set();

      videos.forEach((video) => {
        if (!(video instanceof HTMLVideoElement)) {
          return;
        }
        seen.add(video);
        if (this.controllers.has(video)) {
          this.controllers.get(video).updateEventTarget(resolveGestureTarget(video));
          return;
        }
        if (!this.isCandidateVideo(video)) {
          return;
        }

        const controller = new SwipeSeek.GestureController(
          video,
          this.settings,
          this.overlay,
          {
            eventTarget: resolveGestureTarget(video),
            onTripleTap: this.options.onTripleTap,
            onFirstScrub: this.options.onFirstScrub
          }
        );
        controller.attach();
        this.controllers.set(video, controller);
      });

      for (const [video, controller] of this.controllers.entries()) {
        if (!seen.has(video) || !video.isConnected) {
          controller.detach();
          this.controllers.delete(video);
        }
      }
    }

    isCandidateVideo(video) {
      // 延迟初始化的播放器（Jable/Plyr 等）在首次扫描时可能仍是 0 尺寸或隐藏。
      // 先绑定，真正开始手势时再由 GestureController 校验尺寸和可拖动状态。
      return video.isConnected;
    }
  }

  function isJableHost(hostname) {
    return /(^|\.)jable\.tv$/i.test(hostname || "");
  }

  function resolveGestureTarget(video) {
    if (!isJableHost(global.location && global.location.hostname)) {
      return video;
    }

    // Jable 使用 Plyr，广告层、海报和播放按钮会盖在 video 上方。
    // 在最近的播放器包装层捕获触摸，进度仍写入真实 video 元素。
    return (
      video.closest(".plyr__video-wrapper, #player-container, #player_3, .plyr") || video
    );
  }

  SwipeSeek.VideoDetector = VideoDetector;
  SwipeSeek.isJableHost = isJableHost;
  SwipeSeek.resolveGestureTarget = resolveGestureTarget;
})(typeof globalThis !== "undefined" ? globalThis : window);
