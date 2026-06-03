const params = {
  seats: 277,
  passengers: 263,
  lambdaPeak: 18.41,
  gateServiceTotal: 20,
  bridgeCapacity: 37,
  scanSeconds: 6,
  bridgeWalkSeconds: 40,
  cabinWalkSeconds: 18.1,
  luggageSeconds: 15,
  interferenceSeconds: 10,
  peakMinutes: 10,
};

const policies = {
  random: {
    label: "Random",
    pInt: 0.5,
    optimalRelease: 5.92,
    eq: 5.36,
    gateWaitMinutes: 10.55,
    bridgeWaitMinutes: 0.91,
    holdShare: 0.678,
  },
  reverse: {
    label: "Reverse Pyramid",
    pInt: 0.15,
    optimalRelease: 7.2,
    eq: 6.07,
    gateWaitMinutes: 7.78,
    bridgeWaitMinutes: 0.84,
    holdShare: 0.609,
  },
  wilma: {
    label: "WilMA",
    pInt: 0.075,
    optimalRelease: 7.52,
    eq: 6.02,
    gateWaitMinutes: 7.24,
    bridgeWaitMinutes: 0.8,
    holdShare: 0.592,
  },
};

const lambdaSensitivity = {
  16.57: { random: 9.91, reverse: 7.36, wilma: 6.84 },
  18.41: { random: 11.45, reverse: 8.63, wilma: 8.04 },
  20.25: { random: 13.0, reverse: 9.91, wilma: 9.25 },
};

const intervalSensitivity = {
  5: { random: 11.26, reverse: 8.45, wilma: 7.87 },
  10: { random: 11.45, reverse: 8.63, wilma: 8.04 },
  20: { random: 11.88, reverse: 9.0, wilma: 8.4 },
};

const capacitySensitivity = {
  0.9: { random: 13.24, reverse: 10.11, wilma: 9.44 },
  1: { random: 11.45, reverse: 8.63, wilma: 8.04 },
  1.1: { random: 10.0, reverse: 7.44, wilma: 6.9 },
};

const els = {
  policy: document.querySelector("#policy"),
  lambdaPeak: document.querySelector("#lambdaPeak"),
  lambdaPeakLabel: document.querySelector("#lambdaPeakLabel"),
  decisionInterval: document.querySelector("#decisionInterval"),
  capacityScale: document.querySelector("#capacityScale"),
  restartBtn: document.querySelector("#restartBtn"),
  bestPolicy: document.querySelector("#bestPolicy"),
  bestTime: document.querySelector("#bestTime"),
  bestGain: document.querySelector("#bestGain"),
  pIntValue: document.querySelector("#pIntValue"),
  serviceTimeValue: document.querySelector("#serviceTimeValue"),
  aisleMuValue: document.querySelector("#aisleMuValue"),
  cabinMuValue: document.querySelector("#cabinMuValue"),
  releaseRateValue: document.querySelector("#releaseRateValue"),
  eqValue: document.querySelector("#eqValue"),
  holdShareValue: document.querySelector("#holdShareValue"),
  stabilityValue: document.querySelector("#stabilityValue"),
  componentChart: document.querySelector("#componentChart"),
  policyChart: document.querySelector("#policyChart"),
  gateQueue: document.querySelector("#gateQueue"),
  actionArrow: document.querySelector("#actionArrow"),
  bridgeCount: document.querySelector("#bridgeCount"),
  bufferFill: document.querySelector("#bufferFill"),
  seatedCount: document.querySelector("#seatedCount"),
  simLog: document.querySelector("#simLog"),
};

const sim = {
  timer: null,
  seed: 20260604,
  time: 0,
  bridge: 0,
  gateQueue: 0,
  seated: 0,
  logs: [],
};

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let random = mulberry32(sim.seed);

function poisson(mean) {
  const limit = Math.exp(-mean);
  let value = 0;
  let product = 1;
  do {
    value += 1;
    product *= random();
  } while (product > limit);
  return value - 1;
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function selectedPolicy() {
  return policies[els.policy.value];
}

function serviceMetrics(policy = selectedPolicy()) {
  const scale = Number(els.capacityScale.value);
  const serviceSeconds = params.luggageSeconds + params.interferenceSeconds * policy.pInt;
  const aisleMu = 60 / serviceSeconds;
  const cabinMu = 2 * aisleMu * scale;
  const cabinTime = params.cabinWalkSeconds + serviceSeconds / scale;
  return { serviceSeconds, aisleMu: aisleMu * scale, cabinMu, cabinTime };
}

function interpolateSensitivity(table, policyKey, x) {
  const points = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  if (x <= points[0]) return table[points[0]][policyKey];
  if (x >= points[points.length - 1]) return table[points[points.length - 1]][policyKey];
  for (let i = 0; i < points.length - 1; i += 1) {
    const left = points[i];
    const right = points[i + 1];
    if (x >= left && x <= right) {
      const ratio = (x - left) / (right - left);
      return table[left][policyKey] + (table[right][policyKey] - table[left][policyKey]) * ratio;
    }
  }
  return table[18.41][policyKey];
}

function controlMinutes(policyKey) {
  const lambda = Number(els.lambdaPeak.value);
  const interval = Number(els.decisionInterval.value);
  const scale = Number(els.capacityScale.value);
  const base = lambdaSensitivity[18.41][policyKey];
  const lambdaEffect = interpolateSensitivity(lambdaSensitivity, policyKey, lambda) - base;
  const intervalEffect = intervalSensitivity[interval][policyKey] - base;
  const capacityEffect = capacitySensitivity[scale][policyKey] - base;
  return Math.max(0.5, base + lambdaEffect + intervalEffect + capacityEffect);
}

function policyTotals(policyKey) {
  const policy = policies[policyKey];
  const metrics = serviceMetrics(policy);
  const baseControl = lambdaSensitivity[18.41][policyKey];
  const currentControl = controlMinutes(policyKey);
  const ratio = currentControl / baseControl;
  const gateWaitSeconds = policy.gateWaitMinutes * 60 * ratio;
  const bridgeWaitSeconds = policy.bridgeWaitMinutes * 60 * ratio;
  const totalSeconds =
    gateWaitSeconds + params.scanSeconds + params.bridgeWalkSeconds + bridgeWaitSeconds + metrics.cabinTime;
  return {
    policy,
    metrics,
    gateWaitSeconds,
    bridgeWaitSeconds,
    totalSeconds,
    controlMinutes: currentControl,
    releaseRate: Math.min(policy.optimalRelease * Number(els.capacityScale.value), metrics.cabinMu * 0.99),
  };
}

function renderMetrics() {
  const key = els.policy.value;
  const result = policyTotals(key);
  const { policy, metrics } = result;
  els.lambdaPeakLabel.textContent = fmt(els.lambdaPeak.value, 2);
  els.pIntValue.textContent = fmt(policy.pInt, 3);
  els.serviceTimeValue.textContent = `${fmt(metrics.serviceSeconds, 2)}초`;
  els.aisleMuValue.textContent = `${fmt(metrics.aisleMu, 2)}명/분`;
  els.cabinMuValue.textContent = `${fmt(metrics.cabinMu, 2)}명/분`;
  els.releaseRateValue.textContent = `${fmt(result.releaseRate, 2)}명/분`;
  els.eqValue.textContent = `${fmt(policy.eq, 2)}명`;
  els.holdShareValue.textContent = `${fmt(policy.holdShare * 100, 1)}%`;
  els.stabilityValue.textContent = fmt(result.releaseRate / metrics.cabinMu, 2);

  const totals = Object.keys(policies)
    .map((policyKey) => ({ key: policyKey, ...policyTotals(policyKey) }))
    .sort((a, b) => a.totalSeconds - b.totalSeconds);
  const best = totals[0];
  const randomTotal = policyTotals("random").totalSeconds;
  els.bestPolicy.textContent = best.policy.label;
  els.bestTime.textContent = `${fmt(best.totalSeconds / 60, 2)}분`;
  els.bestGain.textContent = `${fmt((1 - best.totalSeconds / randomTotal) * 100, 1)}% 감소`;

  renderComponentChart(result);
  renderPolicyChart(totals);
}

function renderComponentChart(result) {
  const parts = [
    ["gate", "게이트 제어 대기", result.gateWaitSeconds],
    ["scan", "스캔", params.scanSeconds],
    ["bridge", "탑승교 보행", params.bridgeWalkSeconds],
    ["wait", "탑승교 혼잡", result.bridgeWaitSeconds],
    ["cabin", "기내 이동/착석", result.metrics.cabinTime],
  ];
  const total = parts.reduce((sum, part) => sum + part[2], 0);
  els.componentChart.innerHTML = `
    <div class="component-row">
      <div class="row-label">${result.policy.label}</div>
      <div class="stack">
        ${parts.map(([cls, label, value]) => `<div class="seg ${cls}" title="${label}: ${fmt(value, 1)}초" style="width:${(value / total) * 100}%"></div>`).join("")}
      </div>
      <div class="row-value">${fmt(total / 60, 2)}분</div>
    </div>
    ${parts.map(([, label, value]) => `<div class="component-row"><div class="row-label">${label}</div><div class="bar-track"><div class="bar" style="width:${(value / total) * 100}%"></div></div><div class="row-value">${fmt(value, 1)}초</div></div>`).join("")}
  `;
}

function renderPolicyChart(totals) {
  const max = Math.max(...totals.map((item) => item.totalSeconds));
  els.policyChart.innerHTML = totals
    .map(
      (item) => `
        <div class="bar-row">
          <div class="row-label">${item.policy.label}</div>
          <div class="bar-track"><div class="bar" style="width:${(item.totalSeconds / max) * 100}%"></div></div>
          <div class="row-value">${fmt(item.totalSeconds / 60, 2)}분</div>
        </div>
      `
    )
    .join("");
}

function resetSimulation() {
  sim.seed += 17;
  random = mulberry32(sim.seed);
  sim.time = 0;
  sim.bridge = 0;
  sim.gateQueue = 0;
  sim.seated = 0;
  sim.logs = [];
  renderSim("Ready", 0, 0);
}

function renderSim(action, arrivals, departed) {
  els.gateQueue.textContent = `${sim.gateQueue}명`;
  els.bridgeCount.textContent = `${sim.bridge}/${params.bridgeCapacity}명`;
  els.bufferFill.style.width = `${(sim.bridge / params.bridgeCapacity) * 100}%`;
  els.seatedCount.textContent = `${sim.seated}명`;
  els.actionArrow.textContent = action;
  els.actionArrow.classList.toggle("hold", action === "Hold");
  const minute = Math.floor(sim.time / 60);
  const second = String(sim.time % 60).padStart(2, "0");
  sim.logs.unshift(`[${minute}:${second}] ${action} · 유입 ${arrivals}명 · 기내 유출 ${departed}명 · q=${sim.bridge}`);
  sim.logs = sim.logs.slice(0, 5);
  els.simLog.innerHTML = sim.logs.map((log) => `<div>${log}</div>`).join("");
}

function stepSim() {
  const key = els.policy.value;
  const result = policyTotals(key);
  const dtMinutes = Number(els.decisionInterval.value) / 60;
  const peakArrivals = poisson(Number(els.lambdaPeak.value) * dtMinutes);
  sim.gateQueue += peakArrivals;

  const releaseProbability = Math.max(0, Math.min(1, result.releaseRate / Number(els.lambdaPeak.value)));
  const shouldHold =
    sim.bridge >= Math.round(params.bridgeCapacity * 0.85) ||
    (sim.bridge > result.policy.eq && random() > releaseProbability);
  const action = shouldHold ? "Hold" : "Release";
  let accepted = 0;
  if (!shouldHold) {
    const potential = Math.min(sim.gateQueue, poisson(Number(els.lambdaPeak.value) * dtMinutes));
    accepted = Math.min(potential, params.bridgeCapacity - sim.bridge);
    sim.gateQueue -= accepted;
    sim.bridge += accepted;
  }

  const departed = Math.min(sim.bridge, poisson(result.metrics.cabinMu * dtMinutes));
  sim.bridge -= departed;
  sim.seated = Math.min(params.passengers, sim.seated + departed);
  sim.time += Number(els.decisionInterval.value);
  if (sim.time > params.peakMinutes * 60 || sim.seated >= params.passengers) resetSimulation();
  else renderSim(action, accepted, departed);
}

function bindControls() {
  for (const control of [els.policy, els.lambdaPeak, els.decisionInterval, els.capacityScale]) {
    control.addEventListener("input", () => {
      renderMetrics();
      resetSimulation();
    });
    control.addEventListener("change", () => {
      renderMetrics();
      resetSimulation();
    });
  }
  els.restartBtn.addEventListener("click", resetSimulation);
}

bindControls();
renderMetrics();
resetSimulation();
setInterval(stepSim, 900);
