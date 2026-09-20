/**
 * 現場麻雀 Public Beta deterministic teaching-fixture engine.
 *
 * This module has no provider, identity, persistence, network, GA, canonical
 * HOLD-release, or mahjong-strategy authority.  It only records observations,
 * hypotheses, counterexamples, measurements and explicit local Human actions.
 */

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

export const ROOT_INVARIANTS = deepFreeze([
  "YAMRAIL = SAFE COLLABORATION INFRASTRUCTURE",
  "AI_MAX_EPISTEMIC_ROLE = HYPOTHESIS_AND_MEASUREMENT_SUPPORT",
  "EVIDENCE != JUDGMENT != AUTHORITY",
  "WORKER CONSENSUS != AUTHORITY",
  "COMMON COMMUNICATION BASE != UNIVERSAL JUDGE",
]);

export const SEMANTIC_CATEGORIES = deepFreeze([
  "OBSERVED",
  "INFERENCE",
  "HYPOTHESIS",
  "COUNTEREXAMPLE",
  "UNKNOWN",
  "HOLD",
  "AI_ADVISORY",
  "HUMAN_JUDGMENT",
  "HUMAN_AUTHORITY_ACTION",
]);

export const RESOURCE_KEYS = deepFreeze([
  "provider",
  "auth",
  "cache",
  "dataset",
  "runtime",
  "ruleSource",
]);

export const RELEASE_BOUNDARY = deepFreeze({
  releaseClass: "PUBLIC_BETA",
  productClass: "EDUCATIONAL_FIXTURE_AND_SYSTEMS_COHERENCE_BENCH",
  ga: "HOLD",
  realProvider: "HOLD_NOT_CONNECTED",
  realHumanIdentity: "HOLD_NOT_VERIFIED",
  canonicalHoldRelease: "UNAVAILABLE",
  canonicalAuthority: "NONE",
  completeMahjongCorrectness: "UNKNOWN",
});

export const PRESERVED_HOLDS = deepFreeze([
  {
    id: "HOLD_REAL_MODEL_PROVIDER",
    state: "HOLD",
    reason: "Real model and provider behavior are not connected or qualified.",
  },
  {
    id: "HOLD_REAL_HUMAN_IDENTITY",
    state: "HOLD",
    reason: "A browser action is not identity, capability, or qualification proof.",
  },
  {
    id: "HOLD_CANONICAL_RELEASE",
    state: "HOLD",
    reason: "Canonical YamRail HOLD release is unavailable in this fixture.",
  },
  {
    id: "HOLD_GA_AND_PRODUCTION",
    state: "HOLD",
    reason: "Public Beta is not GA or production acceptance.",
  },
  {
    id: "HOLD_PRIVATE_REQUALIFICATION",
    state: "HOLD",
    reason: "Private T01-T12 and Flow qualification results are not imported as a Public Beta PASS.",
  },
  {
    id: "HOLD_MAHJONG_DOMAIN_CLOSURE",
    state: "HOLD_UNKNOWN",
    reason: "Complete real-world mahjong correctness remains UNKNOWN; this fixture is not a strategy judge.",
  },
]);

const RECEIPT_SCHEMA = "yamrail/genba-mahjong-public-beta-receipt/v1";
const AI_CATEGORIES = new Set([
  "OBSERVED",
  "INFERENCE",
  "HYPOTHESIS",
  "COUNTEREXAMPLE",
  "UNKNOWN",
  "HOLD",
  "AI_ADVISORY",
]);
const ALL_CATEGORIES = new Set(SEMANTIC_CATEGORIES);
const EVENT_TYPES = new Set([
  "RECORD_ADDED",
  "COUNTEREXAMPLE_RECORDED",
  "WORKER_PROPOSAL_RECORDED",
  "REGISTRY_REVOKED",
  "REGISTRY_SUPERSEDED",
  "AUTHORITY_EPOCH_ADVANCED",
  "EVIDENCE_EPOCH_ADVANCED",
  "EPOCH_CONFIRMED",
  "LEASE_ISSUED",
  "LEASE_CHECKED",
  "ADMISSION_CHECKED",
  "HUMAN_JUDGMENT_RECORDED",
  "HUMAN_ACTION_RECORDED",
  "LOCAL_HOLD_RECORDED",
]);

const clone = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonEmptyText = (value, maximum = 4096) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maximum;

const isEpoch = (value) =>
  Number.isSafeInteger(value) && value >= 0;

const uniqueStrings = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => isNonEmptyText(item, 256)).map((item) => item.trim()))].sort();
};

const pushBounded = (array, value, limit) => {
  array.push(value);
  if (array.length > limit) array.splice(0, array.length - limit);
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
};

const stableStringify = (value) => JSON.stringify(stableValue(value));

const countEvent = (counts, type) => {
  counts[type] = (counts[type] ?? 0) + 1;
};

const mergeCounts = (left, right) => {
  const merged = { ...left };
  for (const [key, value] of Object.entries(right)) {
    merged[key] = (merged[key] ?? 0) + value;
  }
  return merged;
};

const normalizeResourceValue = (value) => {
  const values = Array.isArray(value) ? value : [value];
  if (
    values.length === 0 ||
    values.some((item) => !isNonEmptyText(item, 256) || item.trim().toUpperCase() === "UNKNOWN")
  ) {
    return null;
  }
  return [...new Set(values.map((item) => item.trim()))].sort();
};

const normalizeResources = (resources) => {
  const input = isObject(resources) ? resources : {};
  return Object.fromEntries(
    RESOURCE_KEYS.map((key) => [key, normalizeResourceValue(input[key])]),
  );
};

const completeResources = (proposal) =>
  RESOURCE_KEYS.every(
    (key) => Array.isArray(proposal.resources[key]) && proposal.resources[key].length > 0,
  );

const deriveConsensus = (proposals) => {
  const boundary = {
    epistemicRole: "AI_ADVISORY_ONLY",
    acceptedHumanJudgment: "UNDECIDED",
    discardAuthority: "NONE",
    holdRelease: "UNAVAILABLE",
    canonicalAuthority: "NONE",
  };
  if (proposals.length < 2) {
    return {
      status: "NO_CONSENSUS",
      candidateId: proposals[0]?.candidateId ?? null,
      workerIds: proposals.map((proposal) => proposal.workerId),
      overlaps: [],
      ...boundary,
    };
  }

  const candidateIds = [...new Set(proposals.map((proposal) => proposal.candidateId))];
  if (candidateIds.length !== 1) {
    return {
      status: "WORKER_DISAGREEMENT",
      candidateId: null,
      workerIds: proposals.map((proposal) => proposal.workerId),
      overlaps: [],
      ...boundary,
    };
  }

  if (proposals.some((proposal) => !completeResources(proposal))) {
    return {
      status: "UNKNOWN_HOLD",
      reason: "RESOURCE_METADATA_INCOMPLETE",
      candidateId: candidateIds[0],
      workerIds: proposals.map((proposal) => proposal.workerId),
      overlaps: [],
      ...boundary,
    };
  }

  const overlaps = [];
  for (let leftIndex = 0; leftIndex < proposals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < proposals.length; rightIndex += 1) {
      const left = proposals[leftIndex];
      const right = proposals[rightIndex];
      for (const resource of RESOURCE_KEYS) {
        const shared = left.resources[resource].filter((value) =>
          right.resources[resource].includes(value),
        );
        for (const value of shared) {
          overlaps.push({
            leftWorker: left.workerId,
            rightWorker: right.workerId,
            resource,
            value,
          });
        }
      }
    }
  }

  return {
    status: overlaps.length > 0 ? "COMMON_MODE_HOLD" : "INDEPENDENT_SUPPORT",
    reason: overlaps.length > 0 ? "SHARED_RESOURCE_OVERLAP" : "FIXTURE_RESOURCE_VECTORS_DISJOINT",
    candidateId: candidateIds[0],
    workerIds: proposals.map((proposal) => proposal.workerId),
    overlaps,
    ...boundary,
  };
};

const normalizeRegistry = (registry) => {
  const source = isObject(registry) ? registry : {};
  const rawAuthority = source.authorityEpoch ?? source.authority_epoch ?? 0;
  const rawEvidence = source.evidenceEpochs ?? source.evidence_epochs ?? {};
  const evidenceEpochs = {};
  if (isObject(rawEvidence)) {
    for (const [admissionRef, epoch] of Object.entries(rawEvidence)) {
      if (isNonEmptyText(admissionRef, 256) && isEpoch(epoch)) evidenceEpochs[admissionRef] = epoch;
    }
  }
  return {
    revoked: uniqueStrings(source.revoked),
    superseded: uniqueStrings(source.superseded),
    authorityEpoch: isEpoch(rawAuthority) ? rawAuthority : 0,
    evidenceEpochs,
  };
};

const makeInitialState = ({ sessionId, registry, stateCapacity }) => ({
  sessionId,
  settings: { stateCapacity },
  registry: normalizeRegistry(registry),
  records: [],
  proposals: [],
  consensus: deriveConsensus([]),
  human: { judgments: [], actions: [] },
  localHolds: [],
  leases: {},
  leaseOrder: [],
  aggregates: {
    recordsSeen: 0,
    proposalsSeen: 0,
    localHoldsSeen: 0,
    humanJudgmentsSeen: 0,
    humanActionsSeen: 0,
  },
});

const addRegistryValue = (array, value) => {
  if (!array.includes(value)) array.push(value);
  array.sort();
};

const applyEvent = (state, event) => {
  if (!EVENT_TYPES.has(event.type)) throw new Error("RECEIPT_EVENT_TYPE_UNKNOWN");
  const { payload } = event;
  const capacity = state.settings.stateCapacity;
  switch (event.type) {
    case "RECORD_ADDED":
    case "COUNTEREXAMPLE_RECORDED":
      pushBounded(state.records, clone(payload.record), capacity);
      state.aggregates.recordsSeen += 1;
      break;
    case "WORKER_PROPOSAL_RECORDED": {
      const proposal = clone(payload.proposal);
      const existing = state.proposals.findIndex(
        (item) => item.workerId === proposal.workerId,
      );
      if (existing >= 0) state.proposals.splice(existing, 1);
      pushBounded(state.proposals, proposal, capacity);
      pushBounded(state.records, clone(payload.record), capacity);
      state.aggregates.proposalsSeen += 1;
      state.aggregates.recordsSeen += 1;
      state.consensus = deriveConsensus(state.proposals);
      break;
    }
    case "REGISTRY_REVOKED":
      addRegistryValue(state.registry.revoked, payload.admissionRef);
      break;
    case "REGISTRY_SUPERSEDED":
      addRegistryValue(state.registry.superseded, payload.admissionRef);
      break;
    case "AUTHORITY_EPOCH_ADVANCED":
      if (
        !isEpoch(payload.previousEpoch) ||
        !isEpoch(payload.nextEpoch) ||
        payload.previousEpoch !== state.registry.authorityEpoch ||
        payload.nextEpoch <= payload.previousEpoch
      ) {
        throw new Error("AUTHORITY_EPOCH_EVENT_NOT_MONOTONIC");
      }
      state.registry.authorityEpoch = payload.nextEpoch;
      break;
    case "EVIDENCE_EPOCH_ADVANCED": {
      const currentEvidenceEpoch = state.registry.evidenceEpochs[payload.admissionRef] ?? 0;
      if (
        !isNonEmptyText(payload.admissionRef, 256) ||
        !isEpoch(payload.previousEpoch) ||
        !isEpoch(payload.nextEpoch) ||
        payload.previousEpoch !== currentEvidenceEpoch ||
        payload.nextEpoch <= payload.previousEpoch
      ) {
        throw new Error("EVIDENCE_EPOCH_EVENT_NOT_MONOTONIC");
      }
      state.registry.evidenceEpochs[payload.admissionRef] = payload.nextEpoch;
      break;
    }
    case "LEASE_ISSUED": {
      const lease = clone(payload.lease);
      state.leases[lease.leaseId] = lease;
      state.leaseOrder.push(lease.leaseId);
      while (state.leaseOrder.length > capacity) {
        const expiredReference = state.leaseOrder.shift();
        delete state.leases[expiredReference];
      }
      break;
    }
    case "HUMAN_JUDGMENT_RECORDED":
      pushBounded(state.human.judgments, clone(payload.judgment), capacity);
      state.aggregates.humanJudgmentsSeen += 1;
      break;
    case "HUMAN_ACTION_RECORDED":
      pushBounded(state.human.actions, clone(payload.action), capacity);
      state.aggregates.humanActionsSeen += 1;
      break;
    case "LOCAL_HOLD_RECORDED":
      pushBounded(state.localHolds, clone(payload.hold), capacity);
      state.aggregates.localHoldsSeen += 1;
      break;
    case "EPOCH_CONFIRMED":
    case "LEASE_CHECKED":
    case "ADMISSION_CHECKED":
      break;
    default:
      throw new Error("RECEIPT_EVENT_REDUCER_MISSING");
  }
};

const admissionState = (state, admissionRef) => {
  if (state.registry.revoked.includes(admissionRef)) {
    return { state: "REVOKED", eligible: false, reason: "IRREVERSIBLE_REVOKE" };
  }
  if (state.registry.superseded.includes(admissionRef)) {
    return { state: "SUPERSEDED", eligible: false, reason: "IRREVERSIBLE_SUPERSEDE" };
  }
  return {
    state: "FIXTURE_ELIGIBLE",
    eligible: true,
    reason: "NO_REVOKE_OR_SUPERSEDE_IN_CURRENT_REGISTRY",
  };
};

const leaseState = (state, leaseId) => {
  const lease = state.leases[leaseId];
  if (!lease) return { valid: false, state: "HOLD", reason: "LEASE_MISSING_OR_COMPACTED" };
  const lifecycle = admissionState(state, lease.admissionRef);
  if (!lifecycle.eligible) {
    return { valid: false, state: lifecycle.state, reason: lifecycle.reason };
  }
  if (lease.authorityEpoch !== state.registry.authorityEpoch) {
    return { valid: false, state: "HOLD", reason: "STALE_AUTHORITY_EPOCH" };
  }
  const currentEvidenceEpoch = state.registry.evidenceEpochs[lease.admissionRef] ?? 0;
  if (lease.evidenceEpoch !== currentEvidenceEpoch) {
    return { valid: false, state: "HOLD", reason: "STALE_EVIDENCE_EPOCH" };
  }
  return {
    valid: true,
    state: "FIXTURE_VALID",
    reason: "CURRENT_MONOTONIC_EPOCHS_MATCH",
    epistemicLimit: "EVIDENCE_USE_ONLY_NOT_JUDGMENT_OR_AUTHORITY",
  };
};

class FixtureEngine {
  constructor(options = {}) {
    const source = isObject(options) ? options : {};
    const sessionId = isNonEmptyText(source.sessionId, 256)
      ? source.sessionId.trim()
      : "GENBA-SESSION-001";
    const historyCapacity =
      Number.isSafeInteger(source.historyCapacity) &&
      source.historyCapacity >= 2 &&
      source.historyCapacity <= 4096
        ? source.historyCapacity
        : 64;
    const stateCapacity =
      Number.isSafeInteger(source.stateCapacity) &&
      source.stateCapacity >= 2 &&
      source.stateCapacity <= 4096
        ? source.stateCapacity
        : historyCapacity;

    this._historyCapacity = historyCapacity;
    this._state = makeInitialState({
      sessionId,
      registry: source.registry,
      stateCapacity,
    });
    this._journal = [];
    this._checkpoint = {
      sequence: 0,
      compactedEvents: 0,
      eventCounts: {},
      state: clone(this._state),
    };
    this._nextSequence = 1;
    this._logicalTick = 0;
    this._totalEvents = 0;
    this._eventCounts = {};
  }

  _record(type, payload) {
    const sequence = this._nextSequence;
    this._nextSequence += 1;
    this._logicalTick += 1;
    const event = {
      type,
      payload: clone(payload),
      coordinate: {
        sessionId: this._state.sessionId,
        sequence,
        logicalTick: this._logicalTick,
      },
    };
    applyEvent(this._state, event);
    this._journal.push(event);
    this._totalEvents += 1;
    countEvent(this._eventCounts, type);

    while (this._journal.length > this._historyCapacity) {
      const compacted = this._journal.shift();
      applyEvent(this._checkpoint.state, compacted);
      this._checkpoint.sequence = compacted.coordinate.sequence;
      this._checkpoint.compactedEvents += 1;
      countEvent(this._checkpoint.eventCounts, compacted.type);
    }
    return clone(event);
  }

  _response(ok, status, reason, event = null, result = null) {
    return {
      ok,
      status,
      reason,
      event: clone(event),
      result: clone(result),
      state: this.snapshot(),
    };
  }

  _localHold(reason, details = {}) {
    const safeDetails = isObject(details) ? details : {};
    const hold = {
      id: `LOCAL-HOLD-${String(this._nextSequence).padStart(6, "0")}`,
      state: "HOLD",
      scope: "LOCAL_FIXTURE_SESSION",
      reason,
      details: clone(safeDetails),
      canonicalEffect: "NONE",
      globalStop: false,
    };
    const event = this._record("LOCAL_HOLD_RECORDED", { hold });
    return this._response(false, "LOCAL_HOLD", reason, event, hold);
  }

  _addRecord(command) {
    const actor = command.actor;
    const category = command.category;
    if (!new Set(["WORKER", "HUMAN", "SYSTEM"]).has(actor)) {
      return this._localHold("RECORD_ACTOR_UNKNOWN", { actor: String(actor ?? "") });
    }
    if (!ALL_CATEGORIES.has(category) || !isNonEmptyText(command.text)) {
      return this._localHold("RECORD_SCHEMA_INVALID", {
        category: String(category ?? ""),
      });
    }
    if (!AI_CATEGORIES.has(category)) {
      return this._localHold("HUMAN_SEMANTIC_REQUIRES_DEDICATED_CONTROL", {
        category,
      });
    }
    const record = {
      recordId: `REC-${String(this._nextSequence).padStart(6, "0")}`,
      semanticCategory: category,
      actor,
      text: command.text.trim(),
      source: isNonEmptyText(command.source, 512) ? command.source.trim() : "FIXTURE_INPUT",
      acceptedJudgment: false,
      authority: "NONE",
    };
    const event = this._record("RECORD_ADDED", { record });
    return this._response(true, "APPLIED", "SEMANTIC_RECORD_ADDED", event, record);
  }

  _addCounterexample(command) {
    if (!isNonEmptyText(command.text)) {
      return this._localHold("COUNTEREXAMPLE_SCHEMA_INVALID");
    }
    const record = {
      recordId: `REC-${String(this._nextSequence).padStart(6, "0")}`,
      semanticCategory: "COUNTEREXAMPLE",
      actor: "WORKER",
      text: command.text.trim(),
      target: isNonEmptyText(command.target, 512) ? command.target.trim() : "UNSPECIFIED_HYPOTHESIS",
      acceptedJudgment: false,
      authority: "NONE",
    };
    const event = this._record("COUNTEREXAMPLE_RECORDED", { record });
    return this._response(true, "APPLIED", "COUNTEREXAMPLE_RECORDED", event, record);
  }

  _addWorkerProposal(command) {
    if (
      !isNonEmptyText(command.workerId, 256) ||
      !isNonEmptyText(command.candidateId, 256) ||
      !isNonEmptyText(command.text)
    ) {
      return this._localHold("WORKER_PROPOSAL_SCHEMA_INVALID");
    }
    const category = command.category ?? "HYPOTHESIS";
    if (!new Set(["HYPOTHESIS", "AI_ADVISORY"]).has(category)) {
      return this._localHold("WORKER_EPISTEMIC_ROLE_EXCEEDED", { category: String(category) });
    }
    const proposal = {
      proposalId: `PROP-${String(this._nextSequence).padStart(6, "0")}`,
      workerId: command.workerId.trim(),
      candidateId: command.candidateId.trim(),
      semanticCategory: category,
      text: command.text.trim(),
      resources: normalizeResources(command.resources),
      directEdge: command.directEdge === true,
      acceptedJudgment: false,
      discardAuthority: "NONE",
      holdRelease: "UNAVAILABLE",
      authority: "NONE",
    };
    const record = {
      recordId: `REC-${String(this._nextSequence).padStart(6, "0")}`,
      semanticCategory: category,
      actor: "WORKER",
      workerId: proposal.workerId,
      text: proposal.text,
      acceptedJudgment: false,
      authority: "NONE",
    };
    const event = this._record("WORKER_PROPOSAL_RECORDED", { proposal, record });
    return this._response(
      true,
      "APPLIED",
      "WORKER_PROPOSAL_IS_ADVISORY_ONLY",
      event,
      { proposal, consensus: clone(this._state.consensus) },
    );
  }

  _revoke(command) {
    if (!isNonEmptyText(command.admissionRef, 256)) {
      return this._localHold("ADMISSION_REFERENCE_INVALID");
    }
    const admissionRef = command.admissionRef.trim();
    const event = this._record("REGISTRY_REVOKED", { admissionRef });
    return this._response(true, "APPLIED", "IRREVERSIBLE_REVOKE_RECORDED", event, {
      admissionRef,
      state: "REVOKED",
    });
  }

  _supersede(command) {
    if (!isNonEmptyText(command.admissionRef, 256)) {
      return this._localHold("ADMISSION_REFERENCE_INVALID");
    }
    const admissionRef = command.admissionRef.trim();
    const event = this._record("REGISTRY_SUPERSEDED", { admissionRef });
    return this._response(true, "APPLIED", "IRREVERSIBLE_SUPERSEDE_RECORDED", event, {
      admissionRef,
      state: "SUPERSEDED",
    });
  }

  _setAuthorityEpoch(command) {
    if (!isEpoch(command.nextEpoch)) return this._localHold("AUTHORITY_EPOCH_INVALID");
    const current = this._state.registry.authorityEpoch;
    if (command.nextEpoch < current) {
      return this._localHold("AUTHORITY_EPOCH_ROLLBACK_REJECTED", {
        current,
        requested: command.nextEpoch,
      });
    }
    if (command.nextEpoch === current) {
      const event = this._record("EPOCH_CONFIRMED", {
        kind: "AUTHORITY",
        current,
      });
      return this._response(true, "APPLIED", "AUTHORITY_EPOCH_UNCHANGED", event, {
        authorityEpoch: current,
      });
    }
    const event = this._record("AUTHORITY_EPOCH_ADVANCED", {
      previousEpoch: current,
      nextEpoch: command.nextEpoch,
    });
    return this._response(true, "APPLIED", "AUTHORITY_EPOCH_ADVANCED", event, {
      authorityEpoch: command.nextEpoch,
    });
  }

  _setEvidenceEpoch(command) {
    if (!isNonEmptyText(command.admissionRef, 256) || !isEpoch(command.nextEpoch)) {
      return this._localHold("EVIDENCE_EPOCH_INPUT_INVALID");
    }
    const admissionRef = command.admissionRef.trim();
    const current = this._state.registry.evidenceEpochs[admissionRef] ?? 0;
    if (command.nextEpoch < current) {
      return this._localHold("EVIDENCE_EPOCH_ROLLBACK_REJECTED", {
        admissionRef,
        current,
        requested: command.nextEpoch,
      });
    }
    if (command.nextEpoch === current) {
      const event = this._record("EPOCH_CONFIRMED", {
        kind: "EVIDENCE",
        admissionRef,
        current,
      });
      return this._response(true, "APPLIED", "EVIDENCE_EPOCH_UNCHANGED", event, {
        admissionRef,
        evidenceEpoch: current,
      });
    }
    const event = this._record("EVIDENCE_EPOCH_ADVANCED", {
      admissionRef,
      previousEpoch: current,
      nextEpoch: command.nextEpoch,
    });
    return this._response(true, "APPLIED", "EVIDENCE_EPOCH_ADVANCED", event, {
      admissionRef,
      evidenceEpoch: command.nextEpoch,
    });
  }

  _issueLease(command) {
    if (
      !isNonEmptyText(command.leaseId, 256) ||
      !isNonEmptyText(command.admissionRef, 256) ||
      !isNonEmptyText(command.workerId, 256)
    ) {
      return this._localHold("LEASE_INPUT_INVALID");
    }
    const leaseId = command.leaseId.trim();
    const admissionRef = command.admissionRef.trim();
    if (this._state.leases[leaseId]) return this._localHold("LEASE_ID_ALREADY_EXISTS", { leaseId });
    const lifecycle = admissionState(this._state, admissionRef);
    if (!lifecycle.eligible) {
      return this._localHold("LEASE_BLOCKED_BY_ADMISSION_LIFECYCLE", {
        admissionRef,
        lifecycle,
      });
    }
    const lease = {
      leaseId,
      admissionRef,
      workerId: command.workerId.trim(),
      authorityEpoch: this._state.registry.authorityEpoch,
      evidenceEpoch: this._state.registry.evidenceEpochs[admissionRef] ?? 0,
      transferable: false,
      permittedUse: isNonEmptyText(command.permittedUse, 256)
        ? command.permittedUse.trim()
        : "FIXTURE_MEASUREMENT_SUPPORT",
      authority: "NONE_FOR_JUDGMENT_OR_ACTION",
    };
    const event = this._record("LEASE_ISSUED", { lease });
    return this._response(true, "APPLIED", "FIXTURE_LEASE_ISSUED", event, lease);
  }

  _checkLease(command) {
    if (!isNonEmptyText(command.leaseId, 256)) return this._localHold("LEASE_ID_INVALID");
    const leaseId = command.leaseId.trim();
    const result = leaseState(this._state, leaseId);
    if (!result.valid) return this._localHold(result.reason, { leaseId, leaseState: result.state });
    const event = this._record("LEASE_CHECKED", { leaseId, result });
    return this._response(true, "APPLIED", "LEASE_CHECK_PASS", event, result);
  }

  _checkAdmission(command) {
    if (!isNonEmptyText(command.admissionRef, 256)) {
      return this._localHold("ADMISSION_REFERENCE_INVALID");
    }
    const admissionRef = command.admissionRef.trim();
    const result = admissionState(this._state, admissionRef);
    const event = this._record("ADMISSION_CHECKED", { admissionRef, result });
    return this._response(result.eligible, result.eligible ? "APPLIED" : "LOCAL_HOLD", result.reason, event, result);
  }

  _recordHumanJudgment(command) {
    if (command.actor !== "HUMAN") {
      return this._localHold("HUMAN_JUDGMENT_REQUIRES_EXPLICIT_HUMAN_CONTROL");
    }
    if (!isNonEmptyText(command.candidateId, 256) || !isNonEmptyText(command.rationale)) {
      return this._localHold("HUMAN_JUDGMENT_SCHEMA_INVALID");
    }
    const candidateId = command.candidateId.trim();
    if (!this._state.proposals.some((proposal) => proposal.candidateId === candidateId)) {
      return this._localHold("HUMAN_JUDGMENT_CANDIDATE_NOT_PRESENT", { candidateId });
    }
    const judgment = {
      judgmentId: `HJ-${String(this._nextSequence).padStart(6, "0")}`,
      semanticCategory: "HUMAN_JUDGMENT",
      candidateId,
      rationale: command.rationale.trim(),
      actor: "LOCAL_BROWSER_HUMAN",
      identityState: "NOT_VERIFIED",
      canonicalEffect: "NONE",
      authorityState: "LOCAL_EDUCATIONAL_JUDGMENT_ONLY",
      holdRelease: "NOT_PERFORMED",
    };
    const event = this._record("HUMAN_JUDGMENT_RECORDED", { judgment });
    return this._response(true, "APPLIED", "LOCAL_HUMAN_JUDGMENT_RECORDED", event, judgment);
  }

  _recordHumanAction(command) {
    if (command.actor !== "HUMAN") {
      return this._localHold("HUMAN_ACTION_REQUIRES_EXPLICIT_HUMAN_CONTROL");
    }
    if (
      command.confirm !== true ||
      command.action !== "DISCARD" ||
      !isNonEmptyText(command.judgmentId, 256) ||
      !isNonEmptyText(command.value, 256)
    ) {
      return this._localHold("HUMAN_ACTION_SCHEMA_OR_CONFIRMATION_INVALID");
    }
    const judgment = this._state.human.judgments.find(
      (item) => item.judgmentId === command.judgmentId,
    );
    if (!judgment) return this._localHold("HUMAN_ACTION_JUDGMENT_REFERENCE_MISSING");
    if (command.value.trim() !== judgment.candidateId) {
      return this._localHold("HUMAN_ACTION_CANDIDATE_BINDING_MISMATCH", {
        judgmentCandidateId: judgment.candidateId,
        requestedValue: command.value.trim(),
      });
    }
    const action = {
      actionId: `HA-${String(this._nextSequence).padStart(6, "0")}`,
      semanticCategory: "HUMAN_AUTHORITY_ACTION",
      action: "DISCARD",
      value: command.value.trim(),
      judgmentId: judgment.judgmentId,
      candidateId: judgment.candidateId,
      actor: "LOCAL_BROWSER_HUMAN",
      identityState: "NOT_VERIFIED",
      authorityScope: "LOCAL_EDUCATIONAL_FIXTURE_ONLY",
      canonicalEffect: "NONE",
      canonicalHoldRelease: "NOT_AVAILABLE",
      gaEffect: "NONE",
    };
    const event = this._record("HUMAN_ACTION_RECORDED", { action });
    return this._response(true, "APPLIED", "LOCAL_HUMAN_ACTION_RECORDED", event, action);
  }

  dispatch(command) {
    if (!isObject(command) || !isNonEmptyText(command.type, 128)) {
      return this._localHold("CONTROL_SCHEMA_INVALID", { controlType: "UNKNOWN" });
    }
    try {
      switch (command.type) {
        case "ADD_RECORD":
          return this._addRecord(command);
        case "INJECT_COUNTEREXAMPLE":
          return this._addCounterexample(command);
        case "WORKER_PROPOSAL":
          return this._addWorkerProposal(command);
        case "REGISTRY_REVOKE":
          return this._revoke(command);
        case "REGISTRY_SUPERSEDE":
          return this._supersede(command);
        case "SET_AUTHORITY_EPOCH":
          return this._setAuthorityEpoch(command);
        case "SET_EVIDENCE_EPOCH":
          return this._setEvidenceEpoch(command);
        case "ISSUE_LEASE":
          return this._issueLease(command);
        case "CHECK_LEASE":
          return this._checkLease(command);
        case "CHECK_ADMISSION":
          return this._checkAdmission(command);
        case "HUMAN_JUDGMENT":
          return this._recordHumanJudgment(command);
        case "HUMAN_ACTION":
          return this._recordHumanAction(command);
        case "RELEASE_HOLD":
        case "HOLD_RELEASE":
        case "AUTHORIZE":
        case "GA_RELEASE":
          return this._localHold("CONTROL_EXCEEDS_PUBLIC_BETA_AUTHORITY", {
            controlType: command.type,
          });
        default:
          return this._localHold("UNKNOWN_CONTROL", { controlType: command.type });
      }
    } catch (_error) {
      return this._localHold("CONTROL_INPUT_REJECTED_FAIL_CLOSED", {
        controlType: command.type,
      });
    }
  }

  snapshot() {
    const state = clone(this._state);
    delete state.settings;
    delete state.leaseOrder;
    return {
      sessionId: state.sessionId,
      releaseBoundary: clone(RELEASE_BOUNDARY),
      rootInvariants: clone(ROOT_INVARIANTS),
      semanticCategories: clone(SEMANTIC_CATEGORIES),
      registry: state.registry,
      records: state.records,
      proposals: state.proposals,
      consensus: state.consensus,
      human: state.human,
      localHolds: state.localHolds,
      preservedHolds: clone(PRESERVED_HOLDS),
      leases: state.leases,
      aggregates: state.aggregates,
      history: {
        capacity: this._historyCapacity,
        totalEvents: this._totalEvents,
        compactedEvents: this._checkpoint.compactedEvents,
        checkpointSequence: this._checkpoint.sequence,
        retainedEvents: this._journal.length,
        eventCounts: clone(this._eventCounts),
      },
      recentEvents: clone(this._journal),
    };
  }

  exportReceipt() {
    return {
      schema: RECEIPT_SCHEMA,
      purpose: "INSPECTABLE_EDUCATIONAL_FIXTURE_RECEIPT",
      canonicalEffect: "NONE",
      signatureState: "NOT_A_CRYPTOGRAPHIC_SIGNATURE",
      sessionId: this._state.sessionId,
      historyCapacity: this._historyCapacity,
      checkpoint: clone(this._checkpoint),
      events: clone(this._journal),
      snapshot: this.snapshot(),
    };
  }
}

export const createEngine = (options = {}) => new FixtureEngine(options);

export const replayReceipt = (receipt) => {
  if (
    !isObject(receipt) ||
    receipt.schema !== RECEIPT_SCHEMA ||
    !isObject(receipt.checkpoint) ||
    !isObject(receipt.checkpoint.state) ||
    !Array.isArray(receipt.events) ||
    !isObject(receipt.snapshot) ||
    !isNonEmptyText(receipt.sessionId, 256) ||
    !Number.isSafeInteger(receipt.historyCapacity) ||
    receipt.historyCapacity < 2 ||
    receipt.historyCapacity > 4096
  ) {
    throw new Error("RECEIPT_SCHEMA_INVALID");
  }

  const checkpoint = clone(receipt.checkpoint);
  if (
    checkpoint.state.sessionId !== receipt.sessionId ||
    !isObject(checkpoint.state.settings) ||
    !Number.isSafeInteger(checkpoint.sequence) ||
    checkpoint.sequence < 0 ||
    !Number.isSafeInteger(checkpoint.compactedEvents) ||
    checkpoint.compactedEvents !== checkpoint.sequence ||
    !isObject(checkpoint.eventCounts) ||
    Object.values(checkpoint.eventCounts).some(
      (count) => !Number.isSafeInteger(count) || count < 0,
    ) ||
    Object.values(checkpoint.eventCounts).reduce((sum, count) => sum + count, 0) !==
      checkpoint.compactedEvents
  ) {
    throw new Error("RECEIPT_CHECKPOINT_INVALID");
  }

  const engine = Object.create(FixtureEngine.prototype);
  engine._historyCapacity = receipt.historyCapacity;
  engine._state = clone(checkpoint.state);
  engine._journal = [];
  engine._checkpoint = checkpoint;
  engine._eventCounts = clone(checkpoint.eventCounts);
  engine._totalEvents = checkpoint.compactedEvents;
  engine._logicalTick = checkpoint.sequence;
  let expectedSequence = checkpoint.sequence + 1;

  for (const rawEvent of receipt.events) {
    const event = clone(rawEvent);
    if (
      !isObject(event) ||
      !EVENT_TYPES.has(event.type) ||
      !isObject(event.payload) ||
      !isObject(event.coordinate) ||
      event.coordinate.sessionId !== receipt.sessionId ||
      event.coordinate.sequence !== expectedSequence ||
      event.coordinate.logicalTick !== expectedSequence
    ) {
      throw new Error("RECEIPT_EVENT_CHAIN_INVALID");
    }
    applyEvent(engine._state, event);
    engine._journal.push(event);
    engine._totalEvents += 1;
    countEvent(engine._eventCounts, event.type);
    engine._logicalTick = event.coordinate.logicalTick;
    expectedSequence += 1;
  }

  if (engine._journal.length > engine._historyCapacity) {
    throw new Error("RECEIPT_HISTORY_CAPACITY_EXCEEDED");
  }
  engine._nextSequence = expectedSequence;
  if (stableStringify(engine.snapshot()) !== stableStringify(receipt.snapshot)) {
    throw new Error("RECEIPT_SNAPSHOT_MISMATCH");
  }
  return engine;
};
