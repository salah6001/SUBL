(function () {
  const config = {
    minKeys: 20,
    maxDurationMs: 14000,
    backendUrl: "http://localhost:8000/predict",
  };

  let startTime = null;
  let lastDownTime = null;
  let flightTimes = [];
  let dwellTimes = [];
  let keyDownTimes = new Map();
  let deleteCount = 0;
  let keyCount = 0;

  const DELETE_KEYS = new Set(["backspace", "delete"]);

  function toKeyName(event) {
    if (event.key) {
      return event.key.toLowerCase();
    }
    return String(event.code).toLowerCase();
  }

  function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function coefficientOfVariation(values) {
    if (!values.length) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (mean === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  function shouldSend() {
    if (!startTime) return false;
    const elapsed = Date.now() - startTime;
    return keyCount >= config.minKeys || elapsed >= config.maxDurationMs;
  }

  function reset() {
    startTime = null;
    lastDownTime = null;
    flightTimes = [];
    dwellTimes = [];
    keyDownTimes.clear();
    deleteCount = 0;
    keyCount = 0;
  }

  function computeFeatures() {
    const durationMs = Math.max(Date.now() - (startTime || Date.now()), 1);
    return {
      mean_dwell: Number(
        (dwellTimes.length ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0).toFixed(3)
      ),
      median_flight: Number(median(flightTimes).toFixed(3)),
      cv_flight: Number(coefficientOfVariation(flightTimes).toFixed(3)),
      mean_del_freq: Number(((deleteCount / Math.max(keyCount, 1)) * 100).toFixed(3)),
      mean_tot_time: Number(durationMs.toFixed(3)),
    };
  }

  function sendFeatures(features) {
    fetch(config.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      mode: "cors",
    })
      .then((response) => response.json())
      .then((json) => {
        console.log("[MindType Extension] Prediction result:", json);
      })
      .catch((error) => {
        console.warn("[MindType Extension] Failed to post features:", error);
      });
  }

  function onKeyDown(event) {
    const name = toKeyName(event);
    const now = Date.now();
    if (!startTime) startTime = now;
    if (lastDownTime !== null) {
      flightTimes.push((now - lastDownTime) / 1000);
    }
    lastDownTime = now;
    keyDownTimes.set(name, now);
    keyCount += 1;
    if (DELETE_KEYS.has(name)) {
      deleteCount += 1;
    }
    if (shouldSend()) {
      const features = computeFeatures();
      sendFeatures(features);
      reset();
    }
  }

  function onKeyUp(event) {
    const name = toKeyName(event);
    const now = Date.now();
    const downTime = keyDownTimes.get(name);
    if (downTime) {
      dwellTimes.push((now - downTime) / 1000);
      keyDownTimes.delete(name);
    }
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

  console.log("[MindType Extension] Browser keystroke agent injected.");
})();
