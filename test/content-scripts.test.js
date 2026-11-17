"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

global.SwipeSeek = {};
global.location = { hostname: "jable.tv" };
global.window = { innerWidth: 1000 };

require("../src/content/gesture-controller.js");
require("../src/content/video-detector.js");

function makeEventTarget() {
  const added = [];
  const removed = [];
  return {
    added,
    removed,
    addEventListener(type, listener, options) {
      added.push({ type, listener, options });
    },
    removeEventListener(type, listener, capture) {
      removed.push({ type, listener, capture });
    }
  };
}

test("Jable hosts use the nearest Plyr wrapper as the gesture target", () => {
  const wrapper = {};
  const video = {
    closest(selector) {
      assert.match(selector, /plyr__video-wrapper/);
      return wrapper;
    }
  };

  assert.equal(SwipeSeek.isJableHost("jable.tv"), true);
  assert.equal(SwipeSeek.isJableHost("www.jable.tv"), true);
  assert.equal(SwipeSeek.isJableHost("notjable.tv.example"), false);
  assert.equal(SwipeSeek.resolveGestureTarget(video), wrapper);
});

test("other sites continue listening on the video element", () => {
  global.location.hostname = "example.com";
  const video = {
    closest() {
      throw new Error("closest should not be queried outside Jable");
    }
  };

  assert.equal(SwipeSeek.resolveGestureTarget(video), video);
  global.location.hostname = "jable.tv";
});

test("wrapper listeners use capture phase without changing normal video listeners", () => {
  const video = makeEventTarget();
  const wrapper = makeEventTarget();
  const overlay = { hide() {} };
  const controller = new SwipeSeek.GestureController(video, {}, overlay, {});

  controller.attach();
  assert.deepEqual(
    video.added.map(({ type, options }) => [type, options.capture, options.passive]),
    [
      ["touchstart", false, true],
      ["touchmove", false, false],
      ["touchend", false, true],
      ["touchcancel", false, true]
    ]
  );

  controller.updateEventTarget(wrapper);
  assert.equal(video.removed.length, 4);
  assert.equal(video.removed.every(({ capture }) => capture === false), true);
  assert.equal(wrapper.added.length, 4);
  assert.equal(wrapper.added.every(({ options }) => options.capture === true), true);

  controller.detach();
  assert.equal(wrapper.removed.length, 4);
});

test("a swipe received by the Jable wrapper seeks the underlying video", () => {
  const wrapper = makeEventTarget();
  const video = makeEventTarget();
  Object.assign(video, {
    currentTime: 20,
    duration: 100,
    readyState: 1,
    seekable: { length: 0 },
    paused: true,
    ended: false,
    isConnected: true,
    getBoundingClientRect() {
      return { left: 0, right: 500, top: 0, bottom: 300, width: 500, height: 300 };
    }
  });
  const overlay = {
    hide() {},
    showCalls: [],
    show(value) {
      this.showCalls.push(value);
    }
  };
  const settings = {
    enabled: true,
    sensitivity: 0.5,
    activationThreshold: 12,
    controlBarHeight: 0.15,
    scrubThrottleMs: 0,
    minVideoSize: 100,
    pauseWhileScrubbing: false
  };
  const controller = new SwipeSeek.GestureController(video, settings, overlay, {
    eventTarget: wrapper
  });
  controller.attach();

  const listeners = Object.fromEntries(wrapper.added.map(({ type, listener }) => [type, listener]));
  listeners.touchstart({
    touches: [{ identifier: 7, clientX: 100, clientY: 100 }]
  });
  listeners.touchmove({
    touches: [{ identifier: 7, clientX: 200, clientY: 102 }],
    preventDefault() {},
    stopPropagation() {}
  });
  listeners.touchend({
    changedTouches: [{ identifier: 7, clientX: 200, clientY: 102 }]
  });

  assert.equal(video.currentTime, 25);
  assert.equal(overlay.showCalls.length, 1);
});
