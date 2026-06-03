const firstAircraftRow = 1;
const lastAircraftRow = 31;
const crossoverAfterRow = 16;
const jetBridgeSeconds = 40;
const walkingSpeedMps = 1.0;
const economyPitchMeters = 0.85;
const cabinRowTravelSeconds = economyPitchMeters / walkingSpeedMps;
const jetBridgeBufferCapacity = 37;
const releaseHoldThreshold = 15;
const reportTotalSeats = 277;
const reportPassengerCount = 263;
const controlledArrivalRate = 7.52;
const randomCabinCapacity = 6.0;
const reverseCabinCapacity = 7.28;
const wilmaCabinCapacity = 7.62;
const optimalReleaseByStrategy = {
  random: 5.92,
  reversePyramid: 7.2,
  wilma: 7.52,
};
const holdShareByStrategy = {
  random: 0.678,
  reversePyramid: 0.609,
  wilma: 0.592,
};
const pIntByStrategy = {
  random: 0.5,
  reversePyramid: 0.15,
  wilma: 0.075,
};
const eqByStrategy = {
  random: 5.36,
  reversePyramid: 6.07,
  wilma: 6.02,
};
const reportGateToSeatSeconds = {
  random: 771.7,
  reversePyramid: 597.8,
  wilma: 562.25,
};
const reportGateControlSeconds = {
  random: 633.0,
  reversePyramid: 466.8,
  wilma: 434.4,
};
const reportBridgeWaitSeconds = {
  random: 54.6,
  reversePyramid: 50.4,
  wilma: 48.0,
};
const representativeSeed = 20260520;
const replicationCount = 30;
const simStepSeconds = 0.5;
const gateServersFixed = 2;
const seatLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
const windowSeats = new Set(["A", "J"]);
const middleSeats = new Set(["B", "E", "H"]);
const aisleSeats = new Set(["C", "D", "F", "G"]);
const leftCabinSeats = new Set(["A", "B", "C"]);
const centerCabinSeats = new Set(["D", "E", "F"]);
const rightCabinSeats = new Set(["G", "H", "J"]);
const aircraftSeats = buildAircraftSeats();

const strategyNames = {
  random: "랜덤 탑승",
  reversePyramid: "Reverse Pyramid",
  wilma: "WilMA",
};

const strategyNotes = {
  random: "랜덤 방식은 구현이 쉽지만 앞쪽 승객과 뒤쪽 승객이 섞여 통로 병목이 자주 생깁니다.",
  reversePyramid: "Reverse Pyramid는 뒤쪽 창가부터 앞쪽 통로까지 분산시켜 좌석 간섭을 낮추는 중간 성능 정책입니다.",
  wilma: "WilMA는 창가, 중간, 통로 순서로 태워 좌석 간섭 비용을 크게 줄이는 전략입니다.",
};

const state = {
  rows: lastAircraftRow - firstAircraftRow + 1,
  loadFactor: 95,
  bagTime: 15,
  alphaRate: 15,
  capacityMode: "alpha",
  manualCabinCapacity: wilmaCabinCapacity,
  arrivalRate: 18.41,
  serviceRate: 10,
  gateServers: gateServersFixed,
  speed: 5,
  strategy: "wilma",
  running: false,
  timer: null,
  tickMs: 220,
  sim: null,
};

const els = {
  strategy: document.querySelector("#strategy"),
  loadFactor: document.querySelector("#loadFactor"),
  rows: document.querySelector("#rows"),
  bagTime: document.querySelector("#bagTime"),
  alphaRate: document.querySelector("#alphaRate"),
  capacityMode: document.querySelector("#capacityMode"),
  manualCabinCapacity: document.querySelector("#manualCabinCapacity"),
  arrivalRate: document.querySelector("#arrivalRate"),
  serviceRate: document.querySelector("#serviceRate"),
  gateServers: document.querySelector("#gateServers"),
  speed: document.querySelector("#speed"),
  loadFactorLabel: document.querySelector("#loadFactorLabel"),
  rowsLabel: document.querySelector("#rowsLabel"),
  bagTimeLabel: document.querySelector("#bagTimeLabel"),
  alphaRateLabel: document.querySelector("#alphaRateLabel"),
  manualCabinCapacityLabel: document.querySelector("#manualCabinCapacityLabel"),
  arrivalRateLabel: document.querySelector("#arrivalRateLabel"),
  serviceRateLabel: document.querySelector("#serviceRateLabel"),
  gateServersLabel: document.querySelector("#gateServersLabel"),
  speedLabel: document.querySelector("#speedLabel"),
  totalTime: document.querySelector("#totalTime"),
  blockedTicks: document.querySelector("#blockedTicks"),
  seatInterference: document.querySelector("#seatInterference"),
  bufferBlockTime: document.querySelector("#bufferBlockTime"),
  rhoValue: document.querySelector("#rhoValue"),
  lqValue: document.querySelector("#lqValue"),
  wqValue: document.querySelector("#wqValue"),
  releaseValue: document.querySelector("#releaseValue"),
  mmNote: document.querySelector("#mmNote"),
  reportKValue: document.querySelector("#reportKValue"),
  visualKValue: document.querySelector("#visualKValue"),
  bufferValue: document.querySelector("#bufferValue"),
  holdThresholdValue: document.querySelector("#holdThresholdValue"),
  controlledLambdaValue: document.querySelector("#controlledLambdaValue"),
  randomBlockValue: document.querySelector("#randomBlockValue"),
  wilmaBlockValue: document.querySelector("#wilmaBlockValue"),
  alphaValue: document.querySelector("#alphaValue"),
  seatIntProbabilityValue: document.querySelector("#seatIntProbabilityValue"),
  aisleServiceValue: document.querySelector("#aisleServiceValue"),
  totalCabinCapacityValue: document.querySelector("#totalCabinCapacityValue"),
  currentAppliedCapacityValue: document.querySelector("#currentAppliedCapacityValue"),
  bridgeOccupancyValue: document.querySelector("#bridgeOccupancyValue"),
  bufferBlockShareValue: document.querySelector("#bufferBlockShareValue"),
  releaseHoldShareValue: document.querySelector("#releaseHoldShareValue"),
  totalPassengersValue: document.querySelector("#totalPassengersValue"),
  remainingPassengersValue: document.querySelector("#remainingPassengersValue"),
  currentMuValue: document.querySelector("#currentMuValue"),
  avgTransitionValue: document.querySelector("#avgTransitionValue"),
  ltChart: document.querySelector("#ltChart"),
  flowView: document.querySelector("#flowView"),
  queue: document.querySelector("#queue"),
  aircraft: document.querySelector("#aircraft"),
  comparisonChart: document.querySelector("#comparisonChart"),
  totalBoardingChart: document.querySelector("#totalBoardingChart"),
  controlComparison: document.querySelector("#controlComparison"),
  events: document.querySelector("#events"),
  strategyNote: document.querySelector("#strategyNote"),
  runBtn: document.querySelector("#runBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  compareBtn: document.querySelector("#compareBtn"),
};

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatSeconds(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}초` : `${rounded.toFixed(1)}초`;
}

function seatType(seat) {
  if (windowSeats.has(seat)) return 0;
  if (middleSeats.has(seat)) return 1;
  return 2;
}

function rowDepth(row) {
  return row - firstAircraftRow;
}

function rowBand(row) {
  const depth = rowDepth(row);
  if (depth > state.rows * 0.66) return 0;
  if (depth > state.rows * 0.33) return 1;
  return 2;
}

function buildAircraftSeats() {
  const seats = [];

  for (let row = firstAircraftRow; row <= lastAircraftRow; row += 1) {
    for (const seat of seatLetters) seats.push({ row, seat, id: `${row}${seat}` });
  }

  const removeFor277SeatCount = new Set(["31A", "31J"]);
  return seats.filter((seat) => !removeFor277SeatCount.has(seat.id));
}

function isSeatAvailable(row, seat) {
  return aircraftSeats.some((candidate) => candidate.row === row && candidate.seat === seat);
}

function aisleForSeat(seat) {
  if (leftCabinSeats.has(seat)) return 0;
  if (rightCabinSeats.has(seat)) return 1;
  return seat === "F" ? 1 : 0;
}

function canUseCrossover(passenger) {
  return rowDepth(passenger.row) > rowDepth(crossoverAfterRow);
}

function factorial(value) {
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function mmcMetrics(lambda = state.arrivalRate, mu = state.serviceRate, servers = gateServersFixed) {
  const rho = lambda / (servers * mu);
  const capacityRate = Math.min(lambda, servers * mu);
  const releaseInterval = 60 / Math.max(capacityRate, 0.1);

  if (rho >= 1) {
    return {
      rho,
      lq: Infinity,
      wqSeconds: Infinity,
      releaseInterval,
      stable: false,
    };
  }

  const traffic = lambda / mu;
  let sum = 0;
  for (let n = 0; n < servers; n += 1) {
    sum += traffic ** n / factorial(n);
  }
  const last = traffic ** servers / (factorial(servers) * (1 - rho));
  const p0 = 1 / (sum + last);
  const lq = (p0 * traffic ** servers * rho) / (factorial(servers) * (1 - rho) ** 2);
  const wqSeconds = (lq / lambda) * 60;

  return {
    rho,
    lq,
    wqSeconds,
    releaseInterval,
    stable: true,
    gateSeconds: wqSeconds + 60 / mu,
  };
}

function finiteBufferBlockingProbability(lambda, mu, capacity) {
  const rho = lambda / mu;
  if (Math.abs(rho - 1) < 0.0001) return 1 / (capacity + 1);
  return ((1 - rho) * rho ** capacity) / (1 - rho ** (capacity + 1));
}

function cabinCapacityFromAlpha(alphaPercent = state.alphaRate) {
  const alpha = Math.max(0, Math.min(100, alphaPercent)) / 100;
  const seatInterferenceProbability = 0.5 * alpha;
  const aisleOccupancySeconds = 15 + 10 * seatInterferenceProbability;
  const singleAisleMu = 60 / aisleOccupancySeconds;
  const totalCapacity = singleAisleMu * 2;
  return {
    alpha,
    seatInterferenceProbability,
    aisleOccupancySeconds,
    singleAisleMu,
    totalCapacity,
  };
}

function currentOrderedCabinCapacity() {
  if (state.capacityMode === "manual") return state.manualCabinCapacity;
  return cabinCapacityFromAlpha().totalCapacity;
}

function targetCabinCapacity(strategy = state.strategy) {
  if (strategy === "random") return randomCabinCapacity;
  if (strategy === "reversePyramid") return reverseCabinCapacity;
  return currentOrderedCabinCapacity();
}

function targetPInt(strategy = state.strategy) {
  if (strategy === "wilma") return cabinCapacityFromAlpha().seatInterferenceProbability;
  return pIntByStrategy[strategy] ?? pIntByStrategy.random;
}

function calibratedBagSeconds(strategy) {
  const targetCapacity = targetCabinCapacity(strategy);
  const baseline = 102.56 - 6.76 * targetCapacity;
  return Math.max(24, Math.min(70, baseline + (state.bagTime - 10)));
}

function makePassengerList(rows, loadFactor, random) {
  return shuffle(aircraftSeats, random).slice(0, Math.round(aircraftSeats.length * (loadFactor / 100)));
}

function orderPassengers(passengers, strategy, rows, random) {
  const withTie = passengers.map((passenger) => ({ ...passenger, tie: random() }));

  if (strategy === "random") return shuffle(withTie, random);
  if (strategy === "reversePyramid") {
    return withTie.sort((a, b) => {
      const bandDiff = rowBand(a.row) - rowBand(b.row);
      return bandDiff || seatType(a.seat) - seatType(b.seat) || b.row - a.row || a.tie - b.tie;
    });
  }
  return withTie.sort((a, b) => seatType(a.seat) - seatType(b.seat) || a.tie - b.tie);
}

function interferenceFor(passenger, occupied) {
  const { row, seat } = passenger;
  const rowSeats = occupied.get(row) || new Set();
  let blockers = [];
  if (leftCabinSeats.has(seat)) {
    blockers = ["A", "B", "C"].filter((candidate) => seatLetters.indexOf(candidate) > seatLetters.indexOf(seat));
  } else if (rightCabinSeats.has(seat)) {
    blockers = ["G", "H", "J"].filter((candidate) => seatLetters.indexOf(candidate) < seatLetters.indexOf(seat));
  } else if (seat === "E") {
    blockers = ["D", "F"];
  }
  return blockers.filter((candidate) => rowSeats.has(candidate)).length;
}

function seatedCount(sim) {
  if (!sim) return 0;
  let count = 0;
  for (const rowSeats of sim.seated.values()) count += rowSeats.size;
  return count;
}

function remainingCount(sim) {
  if (!sim) return 0;
  return sim.passengers.length - seatedCount(sim);
}

function recordTransition(sim) {
  const duration = sim.time - sim.lastTransitionTime;
  if (duration <= 0) return;
  sim.transitionSamples.push({
    n: remainingCount(sim),
    duration,
    muPerMinute: 60 / duration,
  });
  sim.lastTransitionTime = sim.time;
}

function recordPopulationHistory(sim) {
  const n = remainingCount(sim);
  const last = sim.populationHistory[sim.populationHistory.length - 1];
  if (!last || last.time !== sim.time || last.n !== n) {
    sim.populationHistory.push({ time: sim.time, n });
  }
  if (sim.populationHistory.length > 180) sim.populationHistory.shift();
}

function createSimulation(strategy = state.strategy, animate = true, options = {}) {
  const random = mulberry32(options.seed ?? representativeSeed);
  const passengers = makePassengerList(state.rows, state.loadFactor, random);
  const queue = orderPassengers(passengers, strategy, state.rows, random).map((passenger, index) => ({
    ...passenger,
    label: passenger.id,
    index,
    position: -1,
    aisleIndex: aisleForSeat(passenger.seat),
    targetAisle: aisleForSeat(passenger.seat),
    status: "queue",
    wait: 0,
    bagDuration: 0,
    interference: 0,
  }));

  return {
    animate,
    strategy,
    arrivalRate: options.arrivalRate ?? state.arrivalRate,
    releaseRate: options.releaseRate ?? optimalReleaseByStrategy[strategy] ?? optimalReleaseByStrategy.random,
    holdThreshold: options.holdThreshold === undefined ? null : options.holdThreshold,
    time: 0,
    nextIndex: 0,
    aisles: [Array(state.rows).fill(null), Array(state.rows).fill(null)],
    bridgePassengers: [],
    seated: new Map(),
    passengers: queue,
    nextGateRelease: 0,
    gateHoldTicks: 0,
    lastTransitionTime: 0,
    transitionSamples: [],
    populationHistory: [{ time: 0, n: queue.length }],
    blockedTicks: 0,
    bufferBlockedSeconds: 0,
    bufferBlockedActive: false,
    releaseHoldSeconds: 0,
    releaseHoldActive: false,
    maxBridgeOccupancy: 0,
    seatInterference: 0,
    events: [],
    done: false,
  };
}

function addEvent(sim, text) {
  sim.events.unshift(`[${formatSeconds(sim.time)}] ${text}`);
  sim.events = sim.events.slice(0, 9);
}

function markSeatOccupied(sim, passenger) {
  if (!sim.seated.has(passenger.row)) sim.seated.set(passenger.row, new Set());
  sim.seated.get(passenger.row).add(passenger.seat);
}

function stepSimulation(sim) {
  if (sim.done) return;
  sim.time += simStepSeconds;

  for (let aisleIndex = 0; aisleIndex < sim.aisles.length; aisleIndex += 1) {
    const aisle = sim.aisles[aisleIndex];
    for (let row = state.rows - 1; row >= 0; row -= 1) {
      const passenger = aisle[row];
      if (!passenger) continue;

      const targetPosition = rowDepth(passenger.row);

      if (passenger.status === "loading") {
        passenger.wait -= simStepSeconds;
        if (passenger.wait <= 0) {
          passenger.status = "seated";
          aisle[row] = null;
          recordTransition(sim);
          markSeatOccupied(sim, passenger);
          addEvent(sim, `${passenger.label} 승객 착석 완료`);
        }
        continue;
      }

      if (passenger.nextMoveAt && sim.time < passenger.nextMoveAt) {
        continue;
      }

      if (row === rowDepth(crossoverAfterRow) && passenger.aisleIndex !== passenger.targetAisle) {
        const targetAisle = sim.aisles[passenger.targetAisle];
        if (targetAisle[row] === null) {
          targetAisle[row] = passenger;
          aisle[row] = null;
          passenger.aisleIndex = passenger.targetAisle;
          passenger.nextMoveAt = sim.time + cabinRowTravelSeconds;
          continue;
        }
      }

      if (row === targetPosition) {
        passenger.interference = interferenceFor(passenger, sim.seated);
        passenger.bagDuration = calibratedBagSeconds(sim.strategy) + passenger.interference * 4 + Math.floor(passenger.tie * 3);
        passenger.wait = passenger.bagDuration;
        passenger.status = "loading";
        sim.seatInterference += passenger.interference;
        if (passenger.interference > 0) {
          addEvent(sim, `${passenger.label} 좌석 진입 중 ${passenger.interference}명 비켜섬`);
        }
        continue;
      }

      const nextRow = row + 1;
      if (nextRow < state.rows && aisle[nextRow] === null) {
        aisle[nextRow] = passenger;
        aisle[row] = null;
        passenger.position = nextRow;
        passenger.nextMoveAt = sim.time + cabinRowTravelSeconds;
      } else {
        sim.blockedTicks += 1;
      }
    }
  }

  const gate = mmcMetrics(sim.releaseRate ?? sim.arrivalRate);
  const canReleaseFromGate = sim.time >= sim.nextGateRelease;
  const bridgeHasSpace = sim.bridgePassengers.length < jetBridgeBufferCapacity;
  const underHoldThreshold = sim.holdThreshold === null || sim.bridgePassengers.length < sim.holdThreshold;
  sim.maxBridgeOccupancy = Math.max(sim.maxBridgeOccupancy, sim.bridgePassengers.length);

  if (sim.nextIndex < sim.passengers.length && bridgeHasSpace && !underHoldThreshold) {
    sim.releaseHoldSeconds += simStepSeconds;
    if (!sim.releaseHoldActive) {
      sim.releaseHoldActive = true;
      addEvent(sim, `q*=${sim.holdThreshold}명 도달: 게이트→탑승교 방출 Hold`);
    }
  } else if (sim.releaseHoldActive && underHoldThreshold) {
    sim.releaseHoldActive = false;
    addEvent(sim, `q*=${sim.holdThreshold}명 미만: 게이트→탑승교 방출 Release`);
  }

  if (sim.nextIndex < sim.passengers.length && !bridgeHasSpace) {
    sim.bufferBlockedSeconds += simStepSeconds;
    if (!sim.bufferBlockedActive) {
      sim.bufferBlockedActive = true;
      addEvent(sim, `탑승교 ${jetBridgeBufferCapacity}명 포화: 게이트→탑승교 방출 중지`);
    }
  } else if (sim.bufferBlockedActive && bridgeHasSpace) {
    sim.bufferBlockedActive = false;
    addEvent(sim, "탑승교 여유 발생: 게이트→탑승교 방출 재개");
  }

  if (sim.nextIndex < sim.passengers.length && canReleaseFromGate && bridgeHasSpace && underHoldThreshold) {
    const passenger = sim.passengers[sim.nextIndex];
    passenger.status = "bridge";
    passenger.position = -1;
    passenger.bridgeStart = sim.time;
    passenger.bridgeEnd = sim.time + jetBridgeSeconds;
    sim.bridgePassengers.push(passenger);
    sim.nextIndex += 1;
    sim.nextGateRelease = sim.time + gate.releaseInterval;
  } else if (sim.nextIndex < sim.passengers.length && (!canReleaseFromGate || !bridgeHasSpace || !underHoldThreshold)) {
    sim.gateHoldTicks += 1;
    if (!bridgeHasSpace || !underHoldThreshold) sim.blockedTicks += 1;
  }

  for (let i = sim.bridgePassengers.length - 1; i >= 0; i -= 1) {
    const passenger = sim.bridgePassengers[i];
    if (sim.time < passenger.bridgeEnd) continue;
    const preferredAisle = sim.aisles[passenger.targetAisle];
    const alternateAisleIndex = passenger.targetAisle === 0 ? 1 : 0;
    const alternateAisle = sim.aisles[alternateAisleIndex];
    let entryAisleIndex = passenger.targetAisle;

    if (preferredAisle[0] !== null && canUseCrossover(passenger) && alternateAisle[0] === null) {
      entryAisleIndex = alternateAisleIndex;
    }

    const entryAisle = sim.aisles[entryAisleIndex];
    if (entryAisle[0] === null) {
      passenger.status = "moving";
      passenger.position = 0;
      passenger.aisleIndex = entryAisleIndex;
      passenger.nextMoveAt = sim.time + cabinRowTravelSeconds;
      entryAisle[0] = passenger;
      sim.bridgePassengers.splice(i, 1);
    } else {
      passenger.status = "bridge_wait";
      sim.blockedTicks += 1;
    }
  }

  sim.done =
    sim.nextIndex >= sim.passengers.length &&
    sim.bridgePassengers.length === 0 &&
    sim.aisles.every((aisle) => aisle.every((spot) => spot === null));
  recordPopulationHistory(sim);
}

function renderAircraft() {
  const sim = state.sim;
  els.aircraft.innerHTML = "";

  for (let row = firstAircraftRow; row <= lastAircraftRow; row += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";

    const rowNumber = document.createElement("div");
    rowNumber.className = "row-number";
    rowNumber.textContent = row;
    rowEl.appendChild(rowNumber);

    for (const seat of ["A", "B", "C"]) rowEl.appendChild(renderSeat(row, seat, sim));

    rowEl.appendChild(renderAisle(row, 0, sim));

    for (const seat of ["D", "E", "F"]) rowEl.appendChild(renderSeat(row, seat, sim));

    rowEl.appendChild(renderAisle(row, 1, sim));

    for (const seat of ["G", "H", "J"]) rowEl.appendChild(renderSeat(row, seat, sim));

    els.aircraft.appendChild(rowEl);
    if (row === crossoverAfterRow) els.aircraft.appendChild(renderCrossover());
  }
}

function renderCrossover() {
  const crossover = document.createElement("div");
  crossover.className = "crossover-column";
  crossover.innerHTML = "<span>16-17<br>이동 가능</span>";
  return crossover;
}

function renderAisle(row, aisleIndex, sim) {
  const aisle = document.createElement("div");
  aisle.className = "aisle-cell";
  const passenger = sim?.aisles[aisleIndex]?.[rowDepth(row)];
  if (passenger) aisle.appendChild(renderPassenger(passenger));
  return aisle;
}

function renderSeat(row, seat, sim) {
  const seatEl = document.createElement("div");
  seatEl.className = "seat";
  seatEl.textContent = seat;
  if (!isSeatAvailable(row, seat)) {
    seatEl.classList.add("unavailable");
    seatEl.textContent = "";
    return seatEl;
  }
  if (sim?.seated.get(row)?.has(seat)) seatEl.classList.add("occupied");
  const target = sim?.aisles[aisleForSeat(seat)]?.[rowDepth(row)];
  if (target?.row === row && target.seat === seat) seatEl.classList.add("target");
  return seatEl;
}

function renderPassenger(passenger) {
  const dot = document.createElement("div");
  dot.className = `passenger ${passenger.status === "loading" ? "loading" : ""}`;
  dot.textContent = passenger.label;
  dot.title = `${passenger.label} 좌석으로 이동 중`;
  return dot;
}

function flowPosition(passenger, waitRank = 0) {
  if (passenger.status === "queue") {
    return 5 + (passenger.index % 12) * 0.55;
  }
  if (passenger.status === "bridge" || passenger.status === "bridge_wait") {
    const progress = Math.max(0, Math.min(1, (state.sim.time - passenger.bridgeStart) / jetBridgeSeconds));
    return passenger.status === "bridge_wait" ? 30.5 - (waitRank % 7) * 0.9 : 16 + progress * 15;
  }
  if (passenger.position < 0) return 5;
  return 34 + (passenger.position / Math.max(state.rows - 1, 1)) * 61;
}

function flowTop(passenger, waitRank = 0) {
  if (passenger.status === "bridge_wait") return 108 + Math.floor(waitRank / 7) * 13;
  if (passenger.status === "bridge") return 122;
  return passenger.aisleIndex === 0 ? 89 : 155;
}

function renderFlowView() {
  const sim = state.sim;
  if (!sim || !els.flowView) return;

  els.flowView.innerHTML = `
    <div class="flow-zone gate">게이트 2줄</div>
    <div class="flow-zone bridge">탑승교 한 줄</div>
    <div class="flow-zone cabin">기내 입구에서 좌/우 분기</div>
    <div class="flow-bridge"><span class="flow-lane-label">탑승교 단일 줄</span></div>
    <div class="flow-lane top"><span class="flow-lane-label">왼쪽 통로 A/B/C · D/E</span></div>
    <div class="flow-lane bottom"><span class="flow-lane-label">오른쪽 통로 F · G/H/J</span></div>
  `;

  if (sim.releaseHoldActive || sim.bufferBlockedActive) {
    const blocked = document.createElement("div");
    blocked.className = "flow-gate-block";
    blocked.textContent = sim.releaseHoldActive ? `q*=${sim.holdThreshold} Hold` : "게이트→탑승교 방출 중지";
    els.flowView.appendChild(blocked);
  }

  const active = [
    ...sim.passengers.slice(sim.nextIndex, sim.nextIndex + 10),
    ...sim.bridgePassengers,
    ...sim.aisles.flat().filter(Boolean),
  ];
  const bridgeWaitRanks = new Map(
    sim.bridgePassengers
      .filter((passenger) => passenger.status === "bridge_wait")
      .sort((a, b) => a.bridgeEnd - b.bridgeEnd || a.index - b.index)
      .map((passenger, index) => [passenger, index])
  );

  for (const passenger of active) {
    const waitRank = bridgeWaitRanks.get(passenger) || 0;
    const dot = document.createElement("div");
    dot.className = `flow-passenger ${passenger.status === "loading" ? "loading" : ""} ${passenger.status === "bridge_wait" ? "waiting" : ""}`;
    dot.textContent = passenger.label;
    dot.style.left = `${flowPosition(passenger, waitRank)}%`;
    dot.style.top = `${flowTop(passenger, waitRank)}px`;
    dot.title =
      passenger.status === "bridge_wait"
        ? `${passenger.label}: 기내 입구 또는 통로 점유 때문에 탑승교 내부 대기`
        : `${passenger.label}: 게이트에서 좌석까지 좌→우 진행`;
    els.flowView.appendChild(dot);
  }
}

function renderQueue() {
  const sim = state.sim;
  els.queue.classList.toggle("blocked", Boolean(sim?.bufferBlockedActive || sim?.releaseHoldActive));
  els.queue.innerHTML = `
    <div class="queue-label">${
      sim?.releaseHoldActive
        ? `게이트 대기열 2줄 · q*=${sim.holdThreshold}명 Hold`
        : sim?.bufferBlockedActive
          ? "게이트 대기열 2줄 · 탑승교 포화로 방출 중지"
          : "게이트 대기열 2줄"
    }</div>
    <div class="gate-lane" data-lane="0"><div class="gate-lane-title">Gate A</div></div>
    <div class="gate-lane" data-lane="1"><div class="gate-lane-title">Gate B</div></div>
  `;
  if (!sim) return;
  const laneEls = els.queue.querySelectorAll(".gate-lane");
  const waiting = sim.passengers.slice(sim.nextIndex, sim.nextIndex + 32);
  for (const passenger of waiting) {
    const chip = document.createElement("div");
    chip.className = "queue-chip";
    chip.textContent = passenger.label;
    laneEls[passenger.aisleIndex]?.appendChild(chip);
  }
}

function renderStats() {
  const sim = state.sim;
  const gate = mmcMetrics();
  els.totalTime.textContent = sim ? formatSeconds(sim.time) : "0초";
  els.blockedTicks.textContent = `${sim?.blockedTicks || 0}회`;
  els.seatInterference.textContent = `${sim?.seatInterference || 0}회`;
  if (els.bufferBlockTime) els.bufferBlockTime.textContent = formatSeconds((sim?.releaseHoldSeconds || 0) + (sim?.bufferBlockedSeconds || 0));
  els.strategyNote.textContent = strategyNotes[state.strategy];
  els.rhoValue.textContent = Number.isFinite(gate.rho) ? gate.rho.toFixed(2) : "불안정";
  els.lqValue.textContent = Number.isFinite(gate.lq) ? `${gate.lq.toFixed(1)}명` : "무한대";
  els.wqValue.textContent = Number.isFinite(gate.wqSeconds) ? `${gate.wqSeconds.toFixed(1)}초` : "무한대";
  els.releaseValue.textContent = formatSeconds(gate.releaseInterval);
  els.mmNote.textContent = gate.stable
    ? `NHPP 피크 구간 λ(t)=${state.arrivalRate}명/분, μ=${state.serviceRate}명/분, c=${state.gateServers}일 때 ρ<1이라 안정 상태입니다. 평균적으로 ${gate.releaseInterval.toFixed(1)}초마다 승객이 기내 단계로 넘어갑니다.`
    : `λ(t)가 2μ보다 커서 ρ≥1입니다. 이 경우 피크 구간 게이트 대기열은 안정 상태가 아니므로 게이트 앞 대기열이 계속 증가합니다.`;
  if (gate.stable) {
    const capacity = targetCabinCapacity();
    const releaseRate = optimalReleaseByStrategy[state.strategy] || optimalReleaseByStrategy.random;
    els.mmNote.textContent = `보고서 실험군은 NHPP 피크 λ(t)=${state.arrivalRate}명/분을 기준으로 게이트는 c=2, μ=${state.serviceRate}명/분인 M/M/2 지표로 근사합니다. 현재 기내 처리능력은 ${capacity.toFixed(2)}명/분이고, LP-CMDP 최적 방출률은 λ_c*=${releaseRate.toFixed(2)}명/분입니다.`;
  }
  renderReportMetrics();
}

function renderReportMetrics() {
  if (!els.reportKValue) return;
  const visualPassengers = Math.round(aircraftSeats.length * (state.loadFactor / 100));
  const alphaMetrics = cabinCapacityFromAlpha();
  const orderedCapacity = currentOrderedCabinCapacity();
  const appliedCapacity = targetCabinCapacity(state.strategy);
  const currentReleaseRate = optimalReleaseByStrategy[state.strategy] || optimalReleaseByStrategy.random;
  const currentHoldShare = holdShareByStrategy[state.strategy] || holdShareByStrategy.random;
  const randomPb = finiteBufferBlockingProbability(state.arrivalRate, randomCabinCapacity, jetBridgeBufferCapacity);
  const wilmaPb = finiteBufferBlockingProbability(state.arrivalRate, orderedCapacity, jetBridgeBufferCapacity);
  const sim = state.sim;
  const bufferBlockedSeconds = sim?.bufferBlockedSeconds || 0;
  const releaseHoldSeconds = sim?.releaseHoldSeconds || 0;
  const bufferBlockShare = sim?.time ? (bufferBlockedSeconds / sim.time) * 100 : 0;
  const releaseHoldShare = sim?.time ? (releaseHoldSeconds / sim.time) * 100 : 0;
  els.reportKValue.textContent = `${reportPassengerCount}명/${reportTotalSeats}석`;
  els.visualKValue.textContent = `${visualPassengers}명`;
  els.bufferValue.textContent = `${jetBridgeBufferCapacity}명`;
  if (els.holdThresholdValue) els.holdThresholdValue.textContent = `${currentReleaseRate.toFixed(2)}명/분`;
  els.controlledLambdaValue.textContent = `${currentReleaseRate.toFixed(2)}명/분`;
  els.randomBlockValue.textContent = `${(randomPb * 100).toFixed(1)}%`;
  els.wilmaBlockValue.textContent = `${(wilmaPb * 100).toFixed(1)}%`;
  if (els.alphaValue) els.alphaValue.textContent = `${state.alphaRate}%`;
  if (els.seatIntProbabilityValue) els.seatIntProbabilityValue.textContent = targetPInt(state.strategy).toFixed(3);
  if (els.aisleServiceValue) els.aisleServiceValue.textContent = `${(15 + 10 * targetPInt(state.strategy)).toFixed(2)}초`;
  if (els.totalCabinCapacityValue) {
    const suffix = state.capacityMode === "manual" ? "수동" : "α";
    els.totalCabinCapacityValue.textContent = `${orderedCapacity.toFixed(2)}명/분 (${suffix})`;
  }
  if (els.currentAppliedCapacityValue) {
    const suffix = state.strategy === "random" ? "랜덤 고정" : strategyNames[state.strategy];
    els.currentAppliedCapacityValue.textContent = `${appliedCapacity.toFixed(2)}명/분 (${suffix})`;
  }
  if (els.bridgeOccupancyValue) els.bridgeOccupancyValue.textContent = `${sim?.bridgePassengers.length || 0}/${jetBridgeBufferCapacity}명`;
  if (els.bufferBlockShareValue) els.bufferBlockShareValue.textContent = `${bufferBlockShare.toFixed(1)}%`;
  if (els.releaseHoldShareValue) els.releaseHoldShareValue.textContent = `${(currentHoldShare * 100).toFixed(1)}%`;
}

function renderPopulationChart(sim) {
  if (!sim || !els.ltChart) return;
  const history = sim.populationHistory.length ? sim.populationHistory : [{ time: 0, n: sim.passengers.length }];
  const width = 520;
  const height = 150;
  const pad = 22;
  const maxTime = Math.max(...history.map((point) => point.time), 1);
  const maxN = Math.max(sim.passengers.length, 1);
  const points = history.map((point) => {
    const x = pad + (point.time / maxTime) * (width - pad * 2);
    const y = pad + ((maxN - point.n) / maxN) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPoints = [`${pad},${height - pad}`, ...points, `${width - pad},${height - pad}`].join(" ");

  els.ltChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="L(t) graph">
      <line class="lt-axis" x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line>
      <line class="lt-axis" x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}"></line>
      <polygon class="lt-area" points="${areaPoints}"></polygon>
      <polyline class="lt-line" points="${points.join(" ")}"></polyline>
      <text class="lt-label" x="${pad}" y="15">L(t)=미착석 승객 수</text>
      <text class="lt-label" x="${width - 92}" y="${height - 7}">${formatSeconds(maxTime)}</text>
      <text class="lt-label" x="4" y="${pad + 4}">${maxN}명</text>
      <text class="lt-label" x="8" y="${height - pad}">0</text>
    </svg>
  `;
}

function renderPureDeath() {
  const sim = state.sim;
  if (!sim) return;
  const latest = sim.transitionSamples[sim.transitionSamples.length - 1];
  const avgDuration = sim.transitionSamples.length
    ? sim.transitionSamples.reduce((sum, sample) => sum + sample.duration, 0) / sim.transitionSamples.length
    : null;

  els.totalPassengersValue.textContent = `${sim.passengers.length}명`;
  els.remainingPassengersValue.textContent = `${remainingCount(sim)}명`;
  els.currentMuValue.textContent = latest ? `${latest.muPerMinute.toFixed(2)}명/분` : "-";
  els.avgTransitionValue.textContent = avgDuration ? formatSeconds(avgDuration) : "-";
  renderPopulationChart(sim);
}

function renderEvents() {
  const sim = state.sim;
  els.events.innerHTML = "";
  const events = sim?.events.length ? sim.events : ["시뮬레이션 이벤트가 여기에 표시됩니다."];
  for (const text of events) {
    const event = document.createElement("div");
    event.className = "event";
    event.textContent = text;
    els.events.appendChild(event);
  }
}

function renderAll() {
  renderFlowView();
  renderAircraft();
  renderQueue();
  renderStats();
  renderPureDeath();
  renderEvents();
}

function runLoop() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    if (!state.running || !state.sim) return;
    const steps = Math.max(1, Math.floor(state.speed / 2));
    for (let i = 0; i < steps; i += 1) stepSimulation(state.sim);
    renderAll();
    if (state.sim.done) {
      state.running = false;
      els.runBtn.textContent = "다시 시작";
    }
  }, Math.max(35, state.tickMs - state.speed * 17));
}

function resetSimulation(keepRunning = false) {
  state.sim = createSimulation(state.strategy);
  state.running = keepRunning;
  els.runBtn.textContent = keepRunning ? "실행 중" : "시작";
  renderAll();
  runLoop();
}

function simulateToEnd(strategy, options = {}) {
  const previous = state.sim;
  const sim = createSimulation(strategy, false, options);
  let guard = 0;
  while (!sim.done && guard < 10000) {
    stepSimulation(sim);
    guard += 1;
  }
  state.sim = previous;
  return sim;
}

function summarizeReplications(strategy, options = {}) {
  const samples = [];
  for (let i = 0; i < replicationCount; i += 1) {
    const sim = simulateToEnd(strategy, { ...options, seed: representativeSeed + i * 9973 });
    const gateStopSeconds = sim.releaseHoldSeconds + sim.bufferBlockedSeconds;
    samples.push({
      time: sim.time,
      gateStopSeconds,
      blockShare: sim.time ? (gateStopSeconds / sim.time) * 100 : 0,
      blockedTicks: sim.blockedTicks,
      seatInterference: sim.seatInterference,
    });
  }

  const mean = (key) => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
  const stdev = (key) => {
    const avg = mean(key);
    const variance = samples.reduce((sum, sample) => sum + (sample[key] - avg) ** 2, 0) / Math.max(samples.length - 1, 1);
    return Math.sqrt(variance);
  };

  return {
    samples,
    time: mean("time"),
    timeStdev: stdev("time"),
    gateStopSeconds: mean("gateStopSeconds"),
    gateStopStdev: stdev("gateStopSeconds"),
    blockShare: mean("blockShare"),
    blockedTicks: mean("blockedTicks"),
    seatInterference: mean("seatInterference"),
  };
}

function controlComparisonResults(strategy = state.strategy) {
  const releaseRate = optimalReleaseByStrategy[strategy] || optimalReleaseByStrategy.random;
  const cabinRho = state.arrivalRate / targetCabinCapacity(strategy);
  const controlledTotal = reportGateToSeatSeconds[strategy] || reportGateToSeatSeconds.random;
  return [
    {
      label: "제어 전",
      description: `λ=${state.arrivalRate}명/분 무통제 · ρ_cabin=${cabinRho.toFixed(2)}`,
      valueText: "불안정",
      detailText: "탑승교 포화",
      shareText: "ρ>1",
      width: 100,
    },
    {
      label: "LP-CMDP 후",
      description: `λ_c*=${releaseRate.toFixed(2)}명/분 · 보고서 최종값`,
      valueText: `${(controlledTotal / 60).toFixed(2)}분`,
      detailText: `게이트 대기 ${formatSeconds(reportGateControlSeconds[strategy])}`,
      shareText: `Hold ${(holdShareByStrategy[strategy] * 100).toFixed(1)}%`,
      width: Math.min(100, (controlledTotal / reportGateToSeatSeconds.random) * 100),
    },
  ];
}

function renderControlComparison() {
  if (!els.controlComparison) return;
  const results = controlComparisonResults();
  els.controlComparison.innerHTML = "";

  for (const result of results) {
    const row = document.createElement("div");
    row.className = "control-row";
    row.innerHTML = `
      <div>
        <strong>${result.label}</strong>
        <span>${result.description}</span>
      </div>
      <div class="bar-track"><div class="bar" style="width: ${result.width}%"></div></div>
      <div class="control-values">
        <span>${result.valueText}</span>
        <span>${result.detailText}</span>
        <span>${result.shareText}</span>
      </div>
    `;
    els.controlComparison.appendChild(row);
  }
}

function renderComparison(results) {
  const maxTime = Math.max(...results.map((result) => result.time), 1);
  els.comparisonChart.innerHTML = "";
  for (const result of results) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label">${strategyNames[result.strategy]}</div>
      <div class="bar-track"><div class="bar" style="width: ${(result.time / maxTime) * 100}%"></div></div>
      <div class="bar-value">${(result.time / 60).toFixed(2)}분</div>
    `;
    els.comparisonChart.appendChild(row);
  }
}

function totalBoardingResults() {
  return Object.keys(strategyNames)
    .map((strategy) => {
      const releaseRate = optimalReleaseByStrategy[strategy] || optimalReleaseByStrategy.random;
      const summary = summarizeReplications(strategy, {
        arrivalRate: state.arrivalRate,
        releaseRate,
        holdThreshold: null,
      });
      return {
        strategy,
        time: summary.time,
        timeStdev: summary.timeStdev,
      };
    })
    .sort((a, b) => a.time - b.time);
}

function renderTotalBoardingComparison(results) {
  if (!els.totalBoardingChart) return;
  const maxTime = Math.max(...results.map((result) => result.time), 1);
  els.totalBoardingChart.innerHTML = "";
  for (const result of results) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label">${strategyNames[result.strategy]}</div>
      <div class="bar-track"><div class="bar" style="width: ${(result.time / maxTime) * 100}%"></div></div>
      <div class="bar-value">${(result.time / 60).toFixed(1)}분 ± ${(result.timeStdev / 60).toFixed(1)}분</div>
    `;
    els.totalBoardingChart.appendChild(row);
  }
}

function compareStrategies() {
  const results = Object.keys(strategyNames)
    .map((strategy) => ({
      strategy,
      time: reportGateToSeatSeconds[strategy],
      timeStdev: 0,
      blockedTicks: 0,
      seatInterference: 0,
    }))
    .sort((a, b) => a.time - b.time);

  renderComparison(results);
  renderTotalBoardingComparison(totalBoardingResults());
  renderControlComparison();
}

function updateSettingsFromControls() {
  state.strategy = els.strategy.value;
  state.loadFactor = Number(els.loadFactor.value);
  state.rows = Number(els.rows.value);
  state.bagTime = Number(els.bagTime.value);
  state.alphaRate = Number(els.alphaRate.value);
  state.capacityMode = els.capacityMode.value;
  state.manualCabinCapacity = Number(els.manualCabinCapacity.value);
  state.arrivalRate = Number(els.arrivalRate.value);
  state.serviceRate = Number(els.serviceRate.value);
  state.gateServers = gateServersFixed;
  state.speed = Number(els.speed.value);

  els.loadFactorLabel.textContent = state.loadFactor;
  if (els.rowsLabel) els.rowsLabel.textContent = state.rows;
  els.bagTimeLabel.textContent = state.bagTime;
  if (els.alphaRateLabel) els.alphaRateLabel.textContent = state.alphaRate;
  if (els.manualCabinCapacityLabel) els.manualCabinCapacityLabel.textContent = state.manualCabinCapacity.toFixed(2);
  if (els.manualCabinCapacity) els.manualCabinCapacity.disabled = state.capacityMode !== "manual";
  els.arrivalRateLabel.textContent = state.arrivalRate;
  els.serviceRateLabel.textContent = state.serviceRate;
  if (els.gateServersLabel) els.gateServersLabel.textContent = state.gateServers;
  els.speedLabel.textContent = state.speed;
  els.strategyNote.textContent = strategyNotes[state.strategy];
}

function bindControls() {
  const controls = [
    els.strategy,
    els.loadFactor,
    els.rows,
    els.bagTime,
    els.alphaRate,
    els.capacityMode,
    els.manualCabinCapacity,
    els.arrivalRate,
    els.serviceRate,
    els.gateServers,
    els.speed,
  ].filter(Boolean);

  const handleControlChange = (control) => {
    updateSettingsFromControls();
    if (control !== els.speed) resetSimulation(false);
    else runLoop();
    compareStrategies();
  };

  for (const control of controls) {
    control.addEventListener("input", () => handleControlChange(control));
    control.addEventListener("change", () => handleControlChange(control));
  }

  els.runBtn.addEventListener("click", () => {
    if (!state.sim || state.sim.done) resetSimulation(true);
    state.running = true;
    els.runBtn.textContent = "실행 중";
    runLoop();
  });

  els.pauseBtn.addEventListener("click", () => {
    state.running = false;
    els.runBtn.textContent = "계속";
  });

  els.resetBtn.addEventListener("click", () => resetSimulation(false));
  els.compareBtn.addEventListener("click", compareStrategies);
}

updateSettingsFromControls();
bindControls();
resetSimulation(false);
compareStrategies();
