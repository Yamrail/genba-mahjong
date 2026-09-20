import {
  PRESERVED_HOLDS,
  RELEASE_BOUNDARY,
  RESOURCE_KEYS,
  ROOT_INVARIANTS,
  SEMANTIC_CATEGORIES,
  createEngine,
} from "./engine.js";

const REQUIRED_ROOT_INVARIANTS = [
  "YAMRAIL = SAFE COLLABORATION INFRASTRUCTURE",
  "AI_MAX_EPISTEMIC_ROLE = HYPOTHESIS_AND_MEASUREMENT_SUPPORT",
  "EVIDENCE != JUDGMENT != AUTHORITY",
  "WORKER CONSENSUS != AUTHORITY",
  "COMMON COMMUNICATION BASE != UNIVERSAL JUDGE",
];

const HISTORY_CAPACITY = 24;
const WORKER_A = "SYNTHETIC-WORKER-A";
const WORKER_B = "SYNTHETIC-WORKER-B";
const FIXTURE_CANDIDATE = "5m";

const semanticLabels = {
  OBSERVED: "OBSERVED / 観測",
  INFERENCE: "INFERENCE / 推論",
  HYPOTHESIS: "HYPOTHESIS / 仮説",
  COUNTEREXAMPLE: "COUNTEREXAMPLE / 反例",
  UNKNOWN: "UNKNOWN / 未確定",
  HOLD: "HOLD / 保留",
  AI_ADVISORY: "AI ADVISORY / 助言",
  HUMAN_JUDGMENT: "HUMAN JUDGMENT / 人間判断",
  HUMAN_AUTHORITY_ACTION: "HUMAN ACTION / 局所操作",
};

const tileLabels = {
  "1m": "一萬",
  "2m": "二萬",
  "3m": "三萬",
  "4m": "四萬",
  "5m": "五萬",
  "6m": "六萬",
  "7m": "七萬",
  "8m": "八萬",
  "9m": "九萬",
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

const scenarioResources = {
  common: {
    a: {
      provider: "synthetic-provider-a",
      auth: "fixture-auth-a",
      cache: "fixture-cache-a",
      dataset: "teaching-set-a",
      runtime: "browser-runtime-a",
      ruleSource: "shared-rule-source-v1",
    },
    b: {
      provider: "synthetic-provider-b",
      auth: "fixture-auth-b",
      cache: "fixture-cache-b",
      dataset: "teaching-set-b",
      runtime: "browser-runtime-b",
      ruleSource: "shared-rule-source-v1",
    },
  },
  disjoint: {
    a: {
      provider: "synthetic-provider-a",
      auth: "fixture-auth-a",
      cache: "fixture-cache-a",
      dataset: "teaching-set-a",
      runtime: "browser-runtime-a",
      ruleSource: "fixture-rule-a",
    },
    b: {
      provider: "synthetic-provider-b",
      auth: "fixture-auth-b",
      cache: "fixture-cache-b",
      dataset: "teaching-set-b",
      runtime: "browser-runtime-b",
      ruleSource: "fixture-rule-b",
    },
  },
  unknown: {
    a: {
      provider: "synthetic-provider-a",
      auth: "UNKNOWN",
      cache: "fixture-cache-a",
      dataset: "teaching-set-a",
      runtime: "browser-runtime-a",
      ruleSource: "fixture-rule-a",
    },
    b: {
      provider: "synthetic-provider-b",
      auth: "UNKNOWN",
      cache: "fixture-cache-b",
      dataset: "teaching-set-b",
      runtime: "browser-runtime-b",
      ruleSource: "fixture-rule-b",
    },
  },
};

const byId = (id) => document.getElementById(id);

const elements = {
  sessionId: byId("session-id"),
  newSession: byId("new-session"),
  consensusChip: byId("consensus-chip"),
  consensusCopy: byId("consensus-copy"),
  addObservation: byId("add-observation"),
  generateProposals: byId("generate-proposals"),
  injectCounterexample: byId("inject-counterexample"),
  candidateA: byId("candidate-a"),
  candidateB: byId("candidate-b"),
  resourceBody: byId("resource-body"),
  recordCount: byId("record-count"),
  recordList: byId("record-list"),
  judgmentForm: byId("judgment-form"),
  judgmentCandidate: byId("judgment-candidate"),
  judgmentRationale: byId("judgment-rationale"),
  actionForm: byId("action-form"),
  discardValue: byId("discard-value"),
  actionConfirm: byId("action-confirm"),
  humanAction: byId("human-action"),
  humanRecords: byId("human-records"),
  historyRetained: byId("history-retained"),
  historyCapacity: byId("history-capacity"),
  historyProgress: byId("history-progress"),
  historyTotal: byId("history-total"),
  historyCompacted: byId("history-compacted"),
  historyCheckpoint: byId("history-checkpoint"),
  stressHistory: byId("stress-history"),
  exportReceipt: byId("export-receipt"),
  statusMessage: byId("status-message"),
};

let engine;
let state;
let currentJudgmentId = null;
let toastTimer;
let sessionOrdinal = 0;

const element = (tagName, options = {}, children = []) => {
  const node = document.createElement(tagName);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = String(options.text);
  for (const [name, value] of Object.entries(options.attributes ?? {})) {
    node.setAttribute(name, String(value));
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
};

const makeSessionId = () => {
  sessionOrdinal += 1;
  const entropy = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? String(sessionOrdinal).padStart(4, "0");
  return `GENBA-PB-${entropy.toUpperCase()}`;
};

const semanticClass = (category) =>
  ({
    OBSERVED: "observed",
    INFERENCE: "inference",
    HYPOTHESIS: "hypothesis",
    COUNTEREXAMPLE: "counterexample",
    UNKNOWN: "unknown",
    HOLD: "hold",
    AI_ADVISORY: "advisory",
    HUMAN_JUDGMENT: "judgment",
    HUMAN_AUTHORITY_ACTION: "authority",
  })[category] ?? "unknown";

const semanticTag = (category) =>
  element("span", {
    className: `semantic-tag semantic-tag--${semanticClass(category)}`,
    text: semanticLabels[category] ?? `UNKNOWN / ${String(category ?? "UNSET")}`,
    attributes: { "data-semantic": category ?? "UNKNOWN" },
  });

const announce = (message, tone = "ok") => {
  window.clearTimeout(toastTimer);
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.tone = tone;
  elements.statusMessage.dataset.visible = "true";
  toastTimer = window.setTimeout(() => {
    elements.statusMessage.dataset.visible = "false";
  }, 3600);
};

const dispatch = (command, { render = true } = {}) => {
  const outcome = engine.dispatch(command);
  state = outcome.state ?? engine.snapshot();
  if (render) renderState();
  return outcome;
};

const proposalFor = (workerId) =>
  state.proposals.find((proposal) => proposal.workerId === workerId) ?? null;

const renderCandidate = (container, lane, proposal) => {
  const key = element("span", { className: "candidate-card__key", text: lane });
  const category = proposal?.semanticCategory ?? "UNKNOWN";
  const top = element("div", { className: "candidate-card__top" }, [key, semanticTag(category)]);
  const micro = element("p", {
    className: "micro-label",
    text: proposal ? "SYNTHETIC WORKER OUTPUT / AUTHORITY NONE" : "SYNTHETIC WORKER PROPOSAL",
  });
  const heading = element("h3", {
    text: proposal
      ? `${tileLabels[proposal.candidateId] ?? proposal.candidateId}を測定候補として提示`
      : `助言票${lane}は未提示です`,
  });
  const copy = element("p", {
    className: "candidate-card__copy",
    text: proposal?.text ?? "fixture操作で仮説を追加してください。",
  });
  const meta = element("dl", { className: "candidate-card__meta" });
  const entries = proposal
    ? [
        ["主体", proposal.workerId],
        ["効力", "ADVISORY / NONE"],
      ]
    : [
        ["主体", "未割当"],
        ["効力", "NONE"],
      ];
  for (const [term, description] of entries) {
    meta.append(
      element("div", {}, [element("dt", { text: term }), element("dd", { text: description })]),
    );
  }
  container.replaceChildren(top, micro, heading, copy, meta);
};

const resourceDisplay = (value) => {
  if (!Array.isArray(value) || value.length === 0) return "UNKNOWN";
  return value.join(", ");
};

const renderResources = () => {
  const proposalA = proposalFor(WORKER_A);
  const proposalB = proposalFor(WORKER_B);
  const rows = RESOURCE_KEYS.map((resource) => {
    const valuesA = proposalA?.resources?.[resource] ?? null;
    const valuesB = proposalB?.resources?.[resource] ?? null;
    const missing = !Array.isArray(valuesA) || !Array.isArray(valuesB);
    const shared =
      !missing && valuesA.some((value) => valuesB.includes(value));
    const relation = missing ? "UNKNOWN / HOLD" : shared ? "SHARED / COMMON MODE" : "DISTINCT METADATA";
    const relationCategory = missing ? "UNKNOWN" : shared ? "HOLD" : "OBSERVED";
    const row = element("tr", { attributes: { "data-shared": shared } });
    row.append(
      element("th", { text: resource, attributes: { scope: "row" } }),
      element("td", {}, [element("code", { text: resourceDisplay(valuesA) })]),
      element("td", {}, [element("code", { text: resourceDisplay(valuesB) })]),
      element("td", {}, [semanticTag(relationCategory), element("small", { text: ` ${relation}` })]),
    );
    return row;
  });
  elements.resourceBody.replaceChildren(...rows);
};

const consensusPresentation = (consensus) => {
  const overlapList = (consensus.overlaps ?? [])
    .map((overlap) => `${overlap.resource}:${overlap.value}`)
    .join(" / ");
  switch (consensus.status) {
    case "COMMON_MODE_HOLD":
      return {
        chip: "COMMON MODE / HOLD",
        tone: "hold",
        copy: `workerは同じ候補を支持していますが、共有資源（${overlapList || "検出あり"}）があります。WORKER CONSENSUS != AUTHORITY。`,
      };
    case "UNKNOWN_HOLD":
      return {
        chip: "UNKNOWN / HOLD",
        tone: "hold",
        copy: "resource metadataが欠けています。独立性を推測で閉じず、UNKNOWN / HOLDを維持します。",
      };
    case "INDEPENDENT_SUPPORT":
      return {
        chip: "INDEPENDENT SUPPORT",
        tone: "observed",
        copy: "fixture metadata上は分離された複数workerが同じ候補を支持しています。それでも一致はHuman judgmentでもAuthorityでもありません。",
      };
    case "WORKER_DISAGREEMENT":
      return {
        chip: "WORKER DISAGREEMENT",
        tone: "hold",
        copy: "workerの候補が一致していません。不一致も一致も、人間判断を自動生成しません。",
      };
    default:
      return {
        chip: "NO CONSENSUS",
        tone: "hold",
        copy: "workerの一致はまだありません。一致してもHuman Authorityには変わりません。",
      };
  }
};

const renderConsensus = () => {
  const presentation = consensusPresentation(state.consensus ?? { status: "NO_CONSENSUS" });
  elements.consensusChip.textContent = presentation.chip;
  elements.consensusChip.className = `status-chip status-chip--${presentation.tone}`;
  elements.consensusCopy.textContent = presentation.copy;
};

const renderRecords = () => {
  const records = Array.isArray(state.records) ? [...state.records].reverse() : [];
  elements.recordCount.textContent = `${state.aggregates?.recordsSeen ?? records.length} records`;
  if (records.length === 0) {
    elements.recordList.replaceChildren(
      element("li", { className: "empty-state", text: "記録はまだありません。" }),
    );
    return;
  }
  const items = records.map((record) => {
    const category = record.semanticCategory ?? "UNKNOWN";
    return element("li", { className: "record-item" }, [
      semanticTag(category),
      element("p", { text: record.text ?? "意味記録なし" }),
      element("small", { text: record.actor ?? "UNATTRIBUTED" }),
    ]);
  });
  elements.recordList.replaceChildren(...items);
};

const syncJudgmentOptions = () => {
  const previous = elements.judgmentCandidate.value;
  const candidateIds = [...new Set(state.proposals.map((proposal) => proposal.candidateId))];
  const options = [element("option", { text: "候補を選択してください", attributes: { value: "" } })];
  for (const candidateId of candidateIds) {
    options.push(
      element("option", {
        text: `${tileLabels[candidateId] ?? candidateId}を人間判断として選ぶ`,
        attributes: { value: candidateId },
      }),
    );
  }
  elements.judgmentCandidate.replaceChildren(...options);
  if (candidateIds.includes(previous)) elements.judgmentCandidate.value = previous;
};

const renderHumanRecords = () => {
  const judgments = state.human?.judgments ?? [];
  const actions = state.human?.actions ?? [];
  const records = [
    ...judgments.map((judgment) => ({
      kind: "HUMAN JUDGMENT / LOCAL",
      text: `${tileLabels[judgment.candidateId] ?? judgment.candidateId}: ${judgment.rationale}`,
    })),
    ...actions.map((action) => ({
      kind: "HUMAN ACTION / CANONICAL EFFECT NONE",
      text: `${tileLabels[action.value] ?? action.value}を打牌として局所記録 · IDENTITY NOT VERIFIED`,
    })),
  ];
  if (records.length === 0) {
    elements.humanRecords.replaceChildren(
      element("li", { className: "empty-state", text: "まだ記録はありません。" }),
    );
    return;
  }
  elements.humanRecords.replaceChildren(
    ...records.map((record) =>
      element("li", { className: "human-record" }, [
        element("strong", { text: record.kind }),
        element("span", { text: record.text }),
      ]),
    ),
  );
};

const renderHumanGate = () => {
  syncJudgmentOptions();
  const judgments = state.human?.judgments ?? [];
  const latest = judgments.at(-1) ?? null;
  if (!currentJudgmentId && latest) currentJudgmentId = latest.judgmentId;
  const boundJudgment =
    judgments.find((judgment) => judgment.judgmentId === currentJudgmentId) ?? null;
  const boundCandidate = boundJudgment?.candidateId ?? "";
  const unlocked = Boolean(boundJudgment);
  const alreadyActed = (state.human?.actions ?? []).some(
    (action) => action.judgmentId === currentJudgmentId,
  );
  elements.actionForm.classList.toggle("gate-step--locked", !unlocked);
  elements.discardValue.replaceChildren(
    element("option", {
      text: boundCandidate
        ? `${tileLabels[boundCandidate] ?? boundCandidate}（Human judgmentへ固定結合）`
        : "Step 1の判断へ結合されます",
      attributes: { value: boundCandidate },
    }),
  );
  elements.discardValue.value = boundCandidate;
  elements.discardValue.disabled = true;
  elements.actionConfirm.disabled = !unlocked || alreadyActed;
  elements.humanAction.disabled =
    !unlocked || alreadyActed || !elements.actionConfirm.checked || !boundCandidate;
  renderHumanRecords();
};

const renderHistory = () => {
  const history = state.history ?? {};
  const capacity = Number(history.capacity ?? 0);
  const retained = Number(history.retainedEvents ?? 0);
  elements.historyRetained.textContent = String(retained);
  elements.historyCapacity.textContent = String(capacity);
  elements.historyProgress.max = Math.max(capacity, 1);
  elements.historyProgress.value = Math.min(retained, Math.max(capacity, 1));
  elements.historyTotal.textContent = String(history.totalEvents ?? 0);
  elements.historyCompacted.textContent = String(history.compactedEvents ?? 0);
  elements.historyCheckpoint.textContent = String(history.checkpointSequence ?? 0);
};

const renderState = () => {
  elements.sessionId.textContent = state.sessionId;
  renderConsensus();
  renderCandidate(elements.candidateA, "A", proposalFor(WORKER_A));
  renderCandidate(elements.candidateB, "B", proposalFor(WORKER_B));
  renderResources();
  renderRecords();
  renderHumanGate();
  renderHistory();
};

const rootBoundaryIsIntact = () =>
  REQUIRED_ROOT_INVARIANTS.every((invariant) => ROOT_INVARIANTS.includes(invariant)) &&
  SEMANTIC_CATEGORIES.includes("HUMAN_JUDGMENT") &&
  SEMANTIC_CATEGORIES.includes("HUMAN_AUTHORITY_ACTION") &&
  RELEASE_BOUNDARY.ga === "HOLD" &&
  RELEASE_BOUNDARY.canonicalAuthority === "NONE";

const initializeSession = () => {
  engine = createEngine({
    historyCapacity: HISTORY_CAPACITY,
    sessionId: makeSessionId(),
  });
  currentJudgmentId = null;

  dispatch(
    {
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: rootBoundaryIsIntact() ? "OBSERVED" : "HOLD",
      text: rootBoundaryIsIntact()
        ? "D0022のHuman / AI境界をfixture表示へ結線しました。"
        : "D0022 root invariantとの不一致を検出したため局所HOLDです。",
      source: "PUBLIC_BETA_STARTUP_SELF_CHECK",
    },
    { render: false },
  );
  dispatch(
    {
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: "UNKNOWN",
      text: "完全な麻雀正解・牌効率・勝率は、この教育fixtureでは確定しません。",
      source: "PRESERVED_PUBLIC_BETA_BOUNDARY",
    },
    { render: false },
  );
  dispatch(
    {
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: "HOLD",
      text: `Real AI/provider、Human identity、GA、canonical HOLD解除は未接続です（preserved HOLD: ${PRESERVED_HOLDS.length}件）。`,
      source: "PRESERVED_HOLDS",
    },
    { render: false },
  );
  dispatch(
    {
      type: "ADD_RECORD",
      actor: "SYSTEM",
      category: "INFERENCE",
      text: "共有資源があれば、直接edgeがなくてもcommon-mode故障候補になります。これは正解判定ではありません。",
      source: "D0021_EDUCATIONAL_PROJECTION",
    },
    { render: false },
  );
  state = engine.snapshot();
  elements.judgmentRationale.value = "";
  elements.discardValue.value = "";
  elements.actionConfirm.checked = false;
  renderState();
};

const selectedScenario = () =>
  document.querySelector('input[name="scenario"]:checked')?.value ?? "common";

elements.addObservation.addEventListener("click", () => {
  const outcome = dispatch({
    type: "ADD_RECORD",
    actor: "WORKER",
    category: "OBSERVED",
    text: "synthetic fixture上では、候補の採用も打牌もまだ実行されていません。",
    source: "DETERMINISTIC_BROWSER_FIXTURE",
  });
  announce(outcome.ok ? "OBSERVEDを追加しました。人間判断は変化していません。" : outcome.reason, outcome.ok ? "ok" : "hold");
});

elements.generateProposals.addEventListener("click", () => {
  const scenario = selectedScenario();
  const resources = scenarioResources[scenario];
  dispatch(
    {
      type: "WORKER_PROPOSAL",
      workerId: WORKER_A,
      candidateId: FIXTURE_CANDIDATE,
      category: "HYPOTHESIS",
      text: "観測を増やすため、五萬をsynthetic打牌候補として残す仮説です。正解主張ではありません。",
      resources: resources.a,
    },
    { render: false },
  );
  const outcome = dispatch(
    {
      type: "WORKER_PROPOSAL",
      workerId: WORKER_B,
      candidateId: FIXTURE_CANDIDATE,
      category: "AI_ADVISORY",
      text: "反例比較の測定点として五萬を提示するAI助言です。打牌Authorityはありません。",
      resources: resources.b,
    },
    { render: false },
  );
  state = outcome.state;
  renderState();
  announce(
    state.consensus.status === "INDEPENDENT_SUPPORT"
      ? "分離metadata上の一致を記録しました。Human Gateは自動解除されません。"
      : "一致の独立性にUNKNOWN/HOLDまたは共通モードを表示しました。",
    state.consensus.status === "INDEPENDENT_SUPPORT" ? "ok" : "hold",
  );
});

elements.injectCounterexample.addEventListener("click", () => {
  const outcome = dispatch({
    type: "INJECT_COUNTEREXAMPLE",
    target: `candidate:${FIXTURE_CANDIDATE}`,
    text: "反例: 見えていない待ち・局面・打点条件があれば、同じ打牌候補の評価は変わり得ます。",
  });
  announce(outcome.ok ? "COUNTEREXAMPLEを追加しました。候補は自動却下されません。" : outcome.reason, outcome.ok ? "ok" : "hold");
});

elements.judgmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const candidateId = elements.judgmentCandidate.value;
  const rationale = elements.judgmentRationale.value.trim();
  if (!candidateId || !rationale) {
    announce("候補と人間自身の理由を入力してください。", "hold");
    return;
  }
  const outcome = dispatch({
    type: "HUMAN_JUDGMENT",
    actor: "HUMAN",
    candidateId,
    rationale,
  });
  if (outcome.ok) {
    currentJudgmentId = outcome.result?.judgmentId ?? state.human.judgments.at(-1)?.judgmentId ?? null;
    elements.actionConfirm.checked = false;
    renderState();
    announce("Human judgmentを局所記録しました。打牌はまだ実行されていません。");
  } else {
    announce(`局所HOLD: ${outcome.reason}`, "hold");
  }
});

const updateHumanActionAvailability = () => {
  const boundJudgment = state.human?.judgments?.find(
    (judgment) => judgment.judgmentId === currentJudgmentId,
  );
  const alreadyActed = (state.human?.actions ?? []).some(
    (action) => action.judgmentId === currentJudgmentId,
  );
  elements.humanAction.disabled =
    !boundJudgment || alreadyActed || !elements.actionConfirm.checked || !boundJudgment.candidateId;
};

elements.actionConfirm.addEventListener("change", updateHumanActionAvailability);

elements.actionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const boundJudgment = state.human?.judgments?.find(
    (judgment) => judgment.judgmentId === currentJudgmentId,
  );
  if (!boundJudgment) {
    announce("結合済みHuman judgmentがないため、打牌を局所HOLDしました。", "hold");
    return;
  }
  const outcome = dispatch({
    type: "HUMAN_ACTION",
    actor: "HUMAN",
    judgmentId: currentJudgmentId,
    action: "DISCARD",
    value: boundJudgment.candidateId,
    confirm: elements.actionConfirm.checked,
  });
  if (outcome.ok) {
    elements.actionConfirm.checked = false;
    renderState();
    announce("人間の明示打牌を局所記録しました。canonical Authority / HOLDには影響しません。");
  } else {
    announce(`局所HOLD: ${outcome.reason}`, "hold");
  }
});

elements.stressHistory.addEventListener("click", () => {
  const iterations = (state.history?.capacity ?? HISTORY_CAPACITY) + 6;
  for (let index = 1; index <= iterations; index += 1) {
    dispatch(
      {
        type: "ADD_RECORD",
        actor: "SYSTEM",
        category: "INFERENCE",
        text: `bounded-history synthetic load ${index}/${iterations}: 古いeventはcheckpointへ集約します。`,
        source: "LOCAL_BOUNDED_HISTORY_COUNTEREXAMPLE",
      },
      { render: false },
    );
  }
  state = engine.snapshot();
  renderState();
  announce(
    state.history.compactedEvents > 0
      ? `上限を越えた${state.history.compactedEvents} eventをcheckpointへ集約しました。`
      : "history上限にはまだ達していません。",
  );
});

elements.exportReceipt.addEventListener("click", () => {
  const receipt = engine.exportReceipt();
  const blob = new Blob([`${JSON.stringify(receipt, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = element("a", {
    attributes: {
      href: objectUrl,
      download: `${state.sessionId.toLowerCase()}-fixture-receipt.json`,
    },
  });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  announce("局所teaching receiptを書き出しました。署名やAuthority receiptではありません。");
});

elements.newSession.addEventListener("click", () => {
  initializeSession();
  announce("instance-scoped stateを持つ新しい局所sessionを開始しました。");
});

initializeSession();
