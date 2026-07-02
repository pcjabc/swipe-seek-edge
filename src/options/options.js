"use strict";

const STORAGE_KEY = SwipeSeek.STORAGE_KEY;
const DEFAULT_SETTINGS = SwipeSeek.DEFAULT_SETTINGS;

const form = document.getElementById("settings-form");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");

const fields = {
  enabled: document.getElementById("enabled"),
  sensitivity: document.getElementById("sensitivity"),
  activationThreshold: document.getElementById("activationThreshold"),
  controlBarHeight: document.getElementById("controlBarHeight"),
  pauseWhileScrubbing: document.getElementById("pauseWhileScrubbing")
};

const outputs = {
  sensitivity: document.getElementById("sensitivity-value"),
  activationThreshold: document.getElementById("activationThreshold-value"),
  controlBarHeight: document.getElementById("controlBarHeight-value")
};

function showStatus(message) {
  statusEl.textContent = message;
  window.setTimeout(function clearStatus() {
    if (statusEl.textContent === message) {
      statusEl.textContent = "";
    }
  }, 2200);
}

function settingsToForm(settings) {
  fields.enabled.checked = settings.enabled;
  fields.sensitivity.value = String(Math.round(settings.sensitivity * 100));
  fields.activationThreshold.value = String(settings.activationThreshold);
  fields.controlBarHeight.value = String(Math.round(settings.controlBarHeight * 100));
  fields.pauseWhileScrubbing.checked = settings.pauseWhileScrubbing;
  updateOutputs();
}

function formToSettings() {
  return {
    enabled: fields.enabled.checked,
    sensitivity: Number(fields.sensitivity.value) / 100,
    activationThreshold: Number(fields.activationThreshold.value),
    controlBarHeight: Number(fields.controlBarHeight.value) / 100,
    scrubThrottleMs: DEFAULT_SETTINGS.scrubThrottleMs,
    minVideoSize: DEFAULT_SETTINGS.minVideoSize,
    pauseWhileScrubbing: fields.pauseWhileScrubbing.checked
  };
}

function updateOutputs() {
  outputs.sensitivity.textContent = fields.sensitivity.value + "%";
  outputs.activationThreshold.textContent = fields.activationThreshold.value + " px";
  outputs.controlBarHeight.textContent = fields.controlBarHeight.value + "%";
}

Object.values(fields).forEach(function bindLiveOutput(field) {
  if (field.type === "range") {
    field.addEventListener("input", updateOutputs);
  }
});

form.addEventListener("submit", function onSubmit(event) {
  event.preventDefault();
  const settings = formToSettings();
  chrome.storage.sync.set({ [STORAGE_KEY]: settings }, function onSaved() {
    showStatus("已保存");
  });
});

resetBtn.addEventListener("click", function onReset() {
  settingsToForm(DEFAULT_SETTINGS);
  chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS }, function onResetSaved() {
    showStatus("已恢复默认");
  });
});

chrome.storage.sync.get(STORAGE_KEY, function onLoad(result) {
  settingsToForm({
    ...DEFAULT_SETTINGS,
    ...(result[STORAGE_KEY] || {})
  });
});
