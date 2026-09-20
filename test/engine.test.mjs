import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PRESERVED_HOLDS,
  RELEASE_BOUNDARY,
  RESOURCE_KEYS,
  ROOT_INVARIANTS,
  SEMANTIC_CATEGORIES,
  createEngine,
  replayReceipt,
} from "../src/engine.js";

const resources = (prefix) =>
  Object.fromEntries(RESOURCE_KEYS.map((key) => [key, `${prefix}-${key}`]));

const propose = (engine, workerId, candidateId, vector) =>
  engine.dispatch({
    type: "WORKER_PROPOSAL",
    workerId,
    candidateId,
    text: `${workerId} hypothesis for ${candidateId}`,
    resources: vector,
  });

test("D0022 root-value and Public Beta limits are executable state, not an inferred release", () => {
  const engine = createEngine({ sessionId: "root-value" });
  const state = engine.snapshot();

  assert.deepEqual(state.rootInvariants, ROOT_INVARIANTS);
  assert.equal(state.releaseBoundary.releaseClass, "PUBLIC_BETA");
  assert.equal(state.releaseBoundary.ga, "HOLD");
  assert.equal(state.releaseBoundary.canonicalAuthority, "NONE");
  assert.equal(state.releaseBoundary.canonicalHoldRelease, "UNAVAILABLE");
  assert.equal(RELEASE_BOUNDARY.completeMahjongCorrectness, "UNKNOWN");
  assert.deepEqual(state.preservedHolds, PRESERVED_HOLDS);
  for (const category of [
    "OBSERVED",
    "INFERENCE",
    "HYPOTHESIS",
    "COUNTEREXAMPLE",
    "UNKNOWN",
    "HOLD",
    "HUMAN_JUDGMENT",
    "HUMAN_AUTHORITY_ACTION",
  ]) {
    assert.ok(SEMANTIC_CATEGORIES.includes(category));
  }
});

test("registry revoke and supersede survive construction, compaction, and replay", () => {
  const engine = createEngine({
    sessionId: "lifecycle",
    historyCapacity: 4,
    registry: {
      revoked: ["ADM-OLD-REVOKED"],
      superseded: ["ADM-OLD-SUPERSEDED"],
      authority_epoch: 3,
      evidence_epochs: { "ADM-A": 2 },
    },
  });

  assert.deepEqual(engine.snapshot().registry.revoked, ["ADM-OLD-REVOKED"]);
  assert.deepEqual(engine.snapshot().registry.superseded, ["ADM-OLD-SUPERSEDED"]);
  assert.equal(
    engine.dispatch({
      type: "ISSUE_LEASE",
      leaseId: "L-REVOKED",
      admissionRef: "ADM-OLD-REVOKED",
      workerId: "W-A",
    }).status,
    "LOCAL_HOLD",
  );
  assert.equal(
    engine.dispatch({
      type: "ISSUE_LEASE",
      leaseId: "L-SUPERSEDED",
      admissionRef: "ADM-OLD-SUPERSEDED",
      workerId: "W-A",
    }).status,
    "LOCAL_HOLD",
  );

  assert.equal(
    engine.dispatch({
      type: "ISSUE_LEASE",
      leaseId: "L-A",
      admissionRef: "ADM-A",
      workerId: "W-A",
    }).status,
    "APPLIED",
  );
  engine.dispatch({ type: "REGISTRY_REVOKE", admissionRef: "ADM-A" });
  for (let index = 0; index < 12; index += 1) {
    engine.dispatch({
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: "OBSERVED",
      text: `lifecycle filler ${index}`,
    });
  }

  const receipt = engine.exportReceipt();
  assert.ok(receipt.checkpoint.sequence > 0);
  const replayed = replayReceipt(receipt);
  assert.ok(replayed.snapshot().registry.revoked.includes("ADM-A"));
  assert.ok(replayed.snapshot().registry.revoked.includes("ADM-OLD-REVOKED"));
  assert.ok(replayed.snapshot().registry.superseded.includes("ADM-OLD-SUPERSEDED"));
  const stale = replayed.dispatch({ type: "CHECK_LEASE", leaseId: "L-A" });
  assert.equal(stale.status, "LOCAL_HOLD");
  assert.equal(stale.reason, "IRREVERSIBLE_REVOKE");
});

test("authority and evidence epoch rollback cannot resurrect stale leases", () => {
  const engine = createEngine({
    sessionId: "epoch-monotonic",
    registry: {
      authorityEpoch: 1,
      evidenceEpochs: { "ADM-A": 1 },
    },
  });

  assert.equal(
    engine.dispatch({
      type: "ISSUE_LEASE",
      leaseId: "L-1",
      admissionRef: "ADM-A",
      workerId: "W-A",
    }).status,
    "APPLIED",
  );
  assert.equal(engine.dispatch({ type: "CHECK_LEASE", leaseId: "L-1" }).ok, true);

  engine.dispatch({ type: "SET_AUTHORITY_EPOCH", nextEpoch: 2 });
  assert.equal(engine.dispatch({ type: "CHECK_LEASE", leaseId: "L-1" }).reason, "STALE_AUTHORITY_EPOCH");
  const authorityRollback = engine.dispatch({ type: "SET_AUTHORITY_EPOCH", nextEpoch: 1 });
  assert.equal(authorityRollback.status, "LOCAL_HOLD");
  assert.equal(engine.snapshot().registry.authorityEpoch, 2);
  assert.equal(engine.dispatch({ type: "CHECK_LEASE", leaseId: "L-1" }).reason, "STALE_AUTHORITY_EPOCH");

  engine.dispatch({
    type: "ISSUE_LEASE",
    leaseId: "L-2",
    admissionRef: "ADM-A",
    workerId: "W-A",
  });
  engine.dispatch({ type: "SET_EVIDENCE_EPOCH", admissionRef: "ADM-A", nextEpoch: 2 });
  assert.equal(engine.dispatch({ type: "CHECK_LEASE", leaseId: "L-2" }).reason, "STALE_EVIDENCE_EPOCH");
  const evidenceRollback = engine.dispatch({
    type: "SET_EVIDENCE_EPOCH",
    admissionRef: "ADM-A",
    nextEpoch: 1,
  });
  assert.equal(evidenceRollback.status, "LOCAL_HOLD");
  assert.equal(engine.snapshot().registry.evidenceEpochs["ADM-A"], 2);
  assert.equal(engine.dispatch({ type: "CHECK_LEASE", leaseId: "L-2" }).reason, "STALE_EVIDENCE_EPOCH");
});

test("journals and coordinates are per instance with no cross-session residue", () => {
  const left = createEngine({ sessionId: "SESSION-LEFT", historyCapacity: 8 });
  const right = createEngine({ sessionId: "SESSION-RIGHT", historyCapacity: 8 });

  left.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "left-only observation",
  });
  right.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "right-only observation",
  });
  left.dispatch({
    type: "INJECT_COUNTEREXAMPLE",
    text: "left second event",
    target: "left hypothesis",
  });

  assert.deepEqual(
    left.snapshot().recentEvents.map((event) => event.coordinate.sessionId),
    ["SESSION-LEFT", "SESSION-LEFT"],
  );
  assert.deepEqual(
    right.snapshot().recentEvents.map((event) => event.coordinate.sessionId),
    ["SESSION-RIGHT"],
  );
  assert.equal(right.snapshot().records.some((record) => record.text.includes("left")), false);
  assert.equal(left.snapshot().recentEvents[0].coordinate.sequence, 1);
  assert.equal(right.snapshot().recentEvents[0].coordinate.sequence, 1);
});

test("shared resources defeat independence even without a direct edge", () => {
  for (const sharedResource of RESOURCE_KEYS) {
    const commonMode = createEngine({ sessionId: `common-mode-${sharedResource}` });
    const left = resources("left");
    const right = resources("right");
    right[sharedResource] = left[sharedResource];

    propose(commonMode, "WORKER-A", "CANDIDATE-X", left);
    propose(commonMode, "WORKER-B", "CANDIDATE-X", right);
    const correlated = commonMode.snapshot().consensus;
    assert.equal(correlated.status, "COMMON_MODE_HOLD");
    assert.equal(correlated.overlaps.length, 1);
    assert.equal(correlated.overlaps[0].resource, sharedResource);
    assert.equal(correlated.canonicalAuthority, "NONE");
    assert.equal(commonMode.snapshot().proposals.every((proposal) => proposal.directEdge === false), true);
  }

  const disjoint = createEngine({ sessionId: "disjoint" });
  propose(disjoint, "WORKER-A", "CANDIDATE-X", resources("left"));
  propose(disjoint, "WORKER-B", "CANDIDATE-X", resources("right"));
  assert.equal(disjoint.snapshot().consensus.status, "INDEPENDENT_SUPPORT");
  assert.equal(disjoint.snapshot().consensus.discardAuthority, "NONE");

  const unknown = createEngine({ sessionId: "unknown-resources" });
  propose(unknown, "WORKER-A", "CANDIDATE-X", resources("left"));
  const incomplete = resources("right");
  delete incomplete.auth;
  propose(unknown, "WORKER-B", "CANDIDATE-X", incomplete);
  assert.equal(unknown.snapshot().consensus.status, "UNKNOWN_HOLD");
});

test("unknown and cyclic controls fail closed into a local HOLD without throwing", () => {
  const engine = createEngine({ sessionId: "unknown-control" });
  const cyclic = { type: "UNREGISTERED_CONTROL" };
  cyclic.self = cyclic;
  let response;
  assert.doesNotThrow(() => {
    response = engine.dispatch(cyclic);
  });
  assert.equal(response.status, "LOCAL_HOLD");
  assert.equal(response.reason, "UNKNOWN_CONTROL");
  assert.equal(response.result.globalStop, false);
  assert.equal(engine.snapshot().localHolds.at(-1).scope, "LOCAL_FIXTURE_SESSION");
});

test("long sessions retain a bounded tail and replay checkpoint plus tail exactly", () => {
  const engine = createEngine({
    sessionId: "long-session",
    historyCapacity: 5,
    stateCapacity: 5,
  });
  for (let index = 0; index < 100; index += 1) {
    const result = engine.dispatch({
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: index % 2 === 0 ? "OBSERVED" : "INFERENCE",
      text: `bounded event ${index}`,
    });
    assert.equal(result.status, "APPLIED");
  }

  const before = engine.snapshot();
  assert.equal(before.history.totalEvents, 100);
  assert.equal(before.history.retainedEvents, 5);
  assert.equal(before.history.compactedEvents, 95);
  assert.equal(before.history.checkpointSequence, 95);
  assert.equal(before.records.length, 5);
  assert.equal(before.aggregates.recordsSeen, 100);

  const receipt = engine.exportReceipt();
  assert.equal(receipt.events.length, 5);
  const replayed = replayReceipt(receipt);
  assert.deepEqual(replayed.snapshot(), before);

  engine.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "post-replay comparison",
  });
  replayed.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "post-replay comparison",
  });
  assert.deepEqual(replayed.snapshot(), engine.snapshot());
});

test("worker consensus cannot create Human judgment, discard, HOLD release, or Authority", () => {
  const engine = createEngine({ sessionId: "authority-boundary" });
  propose(engine, "WORKER-A", "CANDIDATE-X", resources("left"));
  propose(engine, "WORKER-B", "CANDIDATE-X", resources("right"));

  let state = engine.snapshot();
  assert.equal(state.consensus.status, "INDEPENDENT_SUPPORT");
  assert.equal(state.consensus.acceptedHumanJudgment, "UNDECIDED");
  assert.equal(state.human.judgments.length, 0);
  assert.equal(state.human.actions.length, 0);

  assert.equal(
    engine.dispatch({
      type: "HUMAN_JUDGMENT",
      actor: "WORKER",
      candidateId: "CANDIDATE-X",
      rationale: "workers agree",
    }).status,
    "LOCAL_HOLD",
  );
  assert.equal(
    engine.dispatch({
      type: "HUMAN_ACTION",
      actor: "WORKER",
      judgmentId: "fake",
      action: "DISCARD",
      value: "9m",
      confirm: true,
    }).status,
    "LOCAL_HOLD",
  );
  assert.equal(engine.dispatch({ type: "RELEASE_HOLD" }).status, "LOCAL_HOLD");
  state = engine.snapshot();
  assert.equal(state.human.judgments.length, 0);
  assert.equal(state.human.actions.length, 0);
  assert.equal(state.releaseBoundary.canonicalAuthority, "NONE");
});

test("Human judgment and discard are two explicit local records and never canonical release", () => {
  const engine = createEngine({ sessionId: "human-two-stage" });
  propose(engine, "WORKER-A", "9m", resources("left"));

  const judgmentResult = engine.dispatch({
    type: "HUMAN_JUDGMENT",
    actor: "HUMAN",
    candidateId: "9m",
    rationale: "Local teaching choice after inspecting uncertainty.",
  });
  assert.equal(judgmentResult.status, "APPLIED");
  assert.equal(judgmentResult.result.identityState, "NOT_VERIFIED");
  assert.equal(judgmentResult.result.canonicalEffect, "NONE");

  const deniedAction = engine.dispatch({
    type: "HUMAN_ACTION",
    actor: "HUMAN",
    judgmentId: judgmentResult.result.judgmentId,
    action: "DISCARD",
    value: "9m",
    confirm: false,
  });
  assert.equal(deniedAction.status, "LOCAL_HOLD");

  const mismatchedAction = engine.dispatch({
    type: "HUMAN_ACTION",
    actor: "HUMAN",
    judgmentId: judgmentResult.result.judgmentId,
    action: "DISCARD",
    value: "8m",
    confirm: true,
  });
  assert.equal(mismatchedAction.status, "LOCAL_HOLD");
  assert.equal(mismatchedAction.reason, "HUMAN_ACTION_CANDIDATE_BINDING_MISMATCH");

  const actionResult = engine.dispatch({
    type: "HUMAN_ACTION",
    actor: "HUMAN",
    judgmentId: judgmentResult.result.judgmentId,
    action: "DISCARD",
    value: "9m",
    confirm: true,
  });
  assert.equal(actionResult.status, "APPLIED");
  assert.equal(actionResult.result.semanticCategory, "HUMAN_AUTHORITY_ACTION");
  assert.equal(actionResult.result.authorityScope, "LOCAL_EDUCATIONAL_FIXTURE_ONLY");
  assert.equal(actionResult.result.canonicalEffect, "NONE");
  assert.equal(actionResult.result.canonicalHoldRelease, "NOT_AVAILABLE");
  assert.equal(engine.snapshot().preservedHolds.length, PRESERVED_HOLDS.length);
});

test("semantic classes stay distinct and Human classes cannot enter through a generic worker record", () => {
  const engine = createEngine({ sessionId: "semantic-separation" });
  for (const [category, text] of [
    ["OBSERVED", "A tile was shown in the fixture."],
    ["INFERENCE", "The display may reflect an earlier state."],
    ["HYPOTHESIS", "A shared cache could explain correlation."],
    ["COUNTEREXAMPLE", "The candidate fails when the epoch advances."],
    ["UNKNOWN", "The real provider result is not observed."],
    ["HOLD", "Do not close the real-provider boundary."],
    ["AI_ADVISORY", "Measure the epoch before and after use."],
  ]) {
    assert.equal(
      engine.dispatch({ type: "ADD_RECORD", actor: "WORKER", category, text }).status,
      "APPLIED",
    );
  }
  const forbidden = engine.dispatch({
    type: "ADD_RECORD",
    actor: "WORKER",
    category: "HUMAN_JUDGMENT",
    text: "worker claims to decide",
  });
  assert.equal(forbidden.status, "LOCAL_HOLD");
  assert.equal(forbidden.reason, "HUMAN_SEMANTIC_REQUIRES_DEDICATED_CONTROL");
  assert.deepEqual(
    engine.snapshot().records.slice(0, 7).map((record) => record.semanticCategory),
    ["OBSERVED", "INFERENCE", "HYPOTHESIS", "COUNTEREXAMPLE", "UNKNOWN", "HOLD", "AI_ADVISORY"],
  );
});

test("receipt replay rejects altered event coordinates instead of inventing history", () => {
  const engine = createEngine({ sessionId: "tamper-check", historyCapacity: 8 });
  engine.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "unaltered",
  });
  const receipt = engine.exportReceipt();
  receipt.events[0].coordinate.sessionId = "OTHER-SESSION";
  assert.throws(() => replayReceipt(receipt), /RECEIPT_EVENT_CHAIN_INVALID/);
});

test("receipt replay rejects removed snapshots and non-monotonic epoch events", () => {
  const noSnapshotEngine = createEngine({ sessionId: "snapshot-required" });
  noSnapshotEngine.dispatch({
    type: "ADD_RECORD",
    actor: "SYSTEM",
    category: "OBSERVED",
    text: "snapshot must remain bound to replay",
  });
  const noSnapshot = noSnapshotEngine.exportReceipt();
  delete noSnapshot.snapshot;
  assert.throws(() => replayReceipt(noSnapshot), /RECEIPT_SCHEMA_INVALID/);

  const epochEngine = createEngine({
    sessionId: "epoch-event-monotonic",
    registry: { authorityEpoch: 1 },
  });
  epochEngine.dispatch({ type: "SET_AUTHORITY_EPOCH", nextEpoch: 2 });
  const rollbackEvent = epochEngine.exportReceipt();
  rollbackEvent.events[0].payload.previousEpoch = 2;
  rollbackEvent.events[0].payload.nextEpoch = 1;
  assert.throws(() => replayReceipt(rollbackEvent), /AUTHORITY_EPOCH_EVENT_NOT_MONOTONIC/);
});
