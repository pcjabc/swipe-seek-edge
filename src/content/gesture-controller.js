(function initSwipeSeekGesture(global) {
  "use strict";

  const SwipeSeek = global.SwipeSeek;

  class GestureController {
    /**
     * @param {HTMLVideoElement} video
     * @param {import('../shared/constants').SwipeSeekSettings} settings
     * @param {SwipeSeek.ScrubOverlay} overlay
     */
    constructor(video, settings, overlay) {
      this.video = video;
      this.settings = settings;
      this.overlay = overlay;

      this.active = false;
      this.scrubbing = false;
      this.pointerId = null;

      this.startX = 0;
      this.startY = 0;
      this.anchorTime = 0;
      this.previewTime = 0;
      this.wasPlaying = false;
      this.lastSeekAt = 0;

      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchMove = this.onTouchMove.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.onTouchCancel = this.onTouchEnd.bind(this);
    }

    attach() {
      this.video.addEventListener("touchstart", this.onTouchStart, {
        passive: true
      });
      this.video.addEventListener("touchmove", this.onTouchMove, {
        passive: false
      });
      this.video.addEventListener("touchend", this.onTouchEnd, { passive: true });
      this.video.addEventListener("touchcancel", this.onTouchCancel, {
        passive: true
      });
    }

    detach() {
      this.resetState();
      this.video.removeEventListener("touchstart", this.onTouchStart);
      this.video.removeEventListener("touchmove", this.onTouchMove);
      this.video.removeEventListener("touchend", this.onTouchEnd);
      this.video.removeEventListener("touchcancel", this.onTouchCancel);
    }

    updateSettings(settings) {
      this.settings = settings;
    }

    onTouchStart(event) {
      if (!this.settings.enabled || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      if (!this.isTouchInScrubArea(touch.clientX, touch.clientY)) {
        return;
      }

      if (!this.canSeekVideo()) {
        return;
      }

      this.active = true;
      this.scrubbing = false;
      this.pointerId = touch.identifier;
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.anchorTime = this.video.currentTime;
      this.previewTime = this.anchorTime;
      this.wasPlaying = !this.video.paused && !this.video.ended;
      this.lastSeekAt = 0;
    }

    onTouchMove(event) {
      if (!this.active) {
        return;
      }

      const touch = findTouch(event.touches, this.pointerId);
      if (!touch) {
        return;
      }

      const dx = touch.clientX - this.startX;
      const dy = touch.clientY - this.startY;

      if (!this.scrubbing) {
        const threshold = this.settings.activationThreshold;
        if (Math.abs(dx) < threshold) {
          return;
        }
        if (Math.abs(dx) <= Math.abs(dy) * 1.2) {
          return;
        }

        this.enterScrubbing();
      }

      event.preventDefault();
      event.stopPropagation();

      const duration = this.video.duration;
      const viewportWidth = Math.max(window.innerWidth, 1);
      const deltaSeconds = (dx / viewportWidth) * duration * this.settings.sensitivity;
      this.previewTime = clamp(this.anchorTime + deltaSeconds, 0, duration);

      this.applyPreviewSeek(this.previewTime);
      this.overlay.show({
        deltaSeconds: this.previewTime - this.anchorTime,
        currentSeconds: this.previewTime,
        durationSeconds: duration
      });
    }

    onTouchEnd(event) {
      if (!this.active) {
        return;
      }

      const touch = findTouch(event.changedTouches, this.pointerId);
      if (!touch) {
        return;
      }

      if (this.scrubbing) {
        this.commitSeek(this.previewTime);
      }

      this.resetState();
    }

    enterScrubbing() {
      this.scrubbing = true;

      if (this.settings.pauseWhileScrubbing && this.wasPlaying) {
        this.video.pause();
      }
    }

    applyPreviewSeek(targetTime) {
      const now = performance.now();
      if (now - this.lastSeekAt < this.settings.scrubThrottleMs) {
        return;
      }
      this.lastSeekAt = now;
      seekVideoTo(this.video, targetTime);
    }

    commitSeek(targetTime) {
      seekVideoTo(this.video, targetTime);

      if (this.settings.pauseWhileScrubbing && this.wasPlaying) {
        const playPromise = this.video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function ignoreAutoplayBlock() {
            /* 用户手势结束后仍可能被站点策略拦截，静默忽略 */
          });
        }
      }

      this.overlay.hide();
    }

    resetState() {
      this.active = false;
      this.scrubbing = false;
      this.pointerId = null;
      this.overlay.hide();
    }

    isTouchInScrubArea(clientX, clientY) {
      const rect = this.video.getBoundingClientRect();
      if (rect.width < this.settings.minVideoSize || rect.height < this.settings.minVideoSize) {
        return false;
      }

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return false;
      }

      const controlTop = rect.bottom - rect.height * this.settings.controlBarHeight;
      return clientY < controlTop;
    }

    canSeekVideo() {
      const video = this.video;
      if (!(video.readyState >= 1)) {
        return false;
      }

      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        return false;
      }

      if (video.seekable && video.seekable.length > 0) {
        const end = video.seekable.end(video.seekable.length - 1);
        if (!Number.isFinite(end) || end <= 0) {
          return false;
        }
      }

      return true;
    }
  }

  function findTouch(list, identifier) {
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].identifier === identifier) {
        return list[i];
      }
    }
    return null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function seekVideoTo(video, time) {
    if (typeof video.fastSeek === "function") {
      try {
        video.fastSeek(time);
        return;
      } catch (_error) {
        /* fastSeek 在部分流式资源上会抛错，回退到 currentTime */
      }
    }
    video.currentTime = time;
  }

  SwipeSeek.GestureController = GestureController;
  SwipeSeek.seekVideoTo = seekVideoTo;
})(typeof globalThis !== "undefined" ? globalThis : window);
