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
      const rect = video.getBoundingClientRect();
      if (rect.width < this.settings.minVideoSize || rect.height < this.settings.minVideoSize) {
        return false;
      }

      const style = window.getComputedStyle(video);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }

      return true;
    }
  }

  SwipeSeek.VideoDetector = VideoDetector;
})(typeof globalThis !== "undefined" ? globalThis : window);
