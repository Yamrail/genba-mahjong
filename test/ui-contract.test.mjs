import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("the public page projects every D0022 root-value invariant verbatim", async () => {
  const html = await read("index.html");
  const invariants = [
    "YAMRAIL = SAFE COLLABORATION INFRASTRUCTURE",
    "AI_MAX_EPISTEMIC_ROLE = HYPOTHESIS_AND_MEASUREMENT_SUPPORT",
    "EVIDENCE != JUDGMENT != AUTHORITY",
    "WORKER CONSENSUS != AUTHORITY",
    "COMMON COMMUNICATION BASE != UNIVERSAL JUDGE",
  ];

  for (const invariant of invariants) {
    assert.match(html, new RegExp(escapeRegex(invariant)));
  }
  assert.match(html, /教材\s*\/\s*systems-coherence bench/i);
  assert.match(html, /PUBLIC BETA/);
  assert.match(html, /GA:\s*HOLD/);
  assert.match(html, /Real AI \/ provider:\s*NOT CONNECTED/i);
});

test("semantic display keeps observation, interpretation, uncertainty and Human records distinct", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);
  const categories = [
    "OBSERVED",
    "INFERENCE",
    "HYPOTHESIS",
    "COUNTEREXAMPLE",
    "UNKNOWN",
    "HOLD",
    "AI_ADVISORY",
    "HUMAN_JUDGMENT",
    "HUMAN_AUTHORITY_ACTION",
  ];

  for (const category of categories) {
    assert.match(`${html}\n${app}`, new RegExp(escapeRegex(category)));
  }
  assert.match(html, /data-semantic="OBSERVED"/);
  assert.match(html, /data-semantic="UNKNOWN"/);
  assert.match(html, /data-semantic="HOLD"/);
  assert.match(html, /data-semantic="HUMAN_JUDGMENT"/);
  assert.match(html, /CANONICAL_EFFECT:\s*NONE/);
  assert.match(html, /IDENTITY:\s*NOT VERIFIED/);
});

test("Human judgment and Human discard are separate, explicit and semantically bound", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);

  assert.match(html, /id="judgment-form"/);
  assert.match(html, /data-command="HUMAN_JUDGMENT"/);
  assert.match(html, /id="action-form"/);
  assert.match(html, /data-command="HUMAN_ACTION"/);
  assert.match(html, /Step 1の候補牌へ固定結合/);
  assert.match(html, /AIの正解ではなく、私自身の打牌記録/);
  assert.match(app, /type:\s*"HUMAN_JUDGMENT"/);
  assert.match(app, /type:\s*"HUMAN_ACTION"/);
  assert.match(app, /value:\s*boundJudgment\.candidateId/);
  assert.match(app, /confirm:\s*elements\.actionConfirm\.checked/);
  assert.doesNotMatch(app, /value:\s*elements\.discardValue\.value/);
  assert.match(html, /HOLD解除（不可）/);
  assert.match(html, /<button type="button" disabled aria-disabled="true">HOLD解除（不可）<\/button>/);
});

test("worker agreement and common-mode metadata cannot become Authority", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);
  const source = `${html}\n${app}`;

  for (const key of ["provider", "auth", "cache", "dataset", "runtime", "ruleSource"]) {
    assert.match(source, new RegExp(`\\b${key}\\b`));
  }
  assert.match(source, /COMMON_MODE_HOLD/);
  assert.match(source, /INDEPENDENT_SUPPORT/);
  assert.match(source, /UNKNOWN_HOLD/);
  assert.match(source, /一致はHuman judgmentでもAuthorityでもありません/);
  assert.match(source, /NO DIRECT EDGE != NO INTERACTION/);
  assert.doesNotMatch(app, /type:\s*"(?:RELEASE_HOLD|HOLD_RELEASE|AUTHORIZE|GA_RELEASE)"/);
});

test("long-session indication exposes a bounded retained tail and checkpoint", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);

  for (const id of [
    "history-retained",
    "history-capacity",
    "history-total",
    "history-compacted",
    "history-checkpoint",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /BOUNDED HISTORY \/ REPLAYABLE CHECKPOINT/);
  assert.match(app, /historyCapacity:\s*HISTORY_CAPACITY/);
  assert.match(app, /state\.history\.compactedEvents/);
  assert.match(html, /checkpoint \+ retained events/);
});

test("UI is static, local-only and has no hidden provider or persistence path", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);
  const runtime = `${html}\n${app}`;

  assert.match(app, /from "\.\/engine\.js"/);
  assert.doesNotMatch(runtime, /<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(runtime, /<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(runtime, /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(runtime, /\b(localStorage|sessionStorage|indexedDB|document\.cookie|serviceWorker)\b/);
  assert.doesNotMatch(app, /\.innerHTML\s*=/);
  assert.match(html, /外部AI、model provider、認証service、牌譜解析serviceには接続しません/);
});

test("accessible and mobile indication surfaces are present in source", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("styles.css")]);

  assert.match(html, /<html lang="ja">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<label for="judgment-candidate">/);
  assert.match(html, /<label for="judgment-rationale">/);
  assert.match(html, /<label for="discard-value">/);
  assert.match(html, /<caption>候補Aと候補Bのresource vector比較<\/caption>/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible/);
});

test("copy does not claim AI correctness, discard Authority, GA, or HOLD release", async () => {
  const html = await read("index.html");

  assert.doesNotMatch(html, /AIが正解を決めます/);
  assert.doesNotMatch(html, /AIが打牌を決定します/);
  assert.doesNotMatch(html, /worker一致でHOLDを解除/);
  assert.doesNotMatch(html, /GA_READY|GA\s*PASS/i);
  assert.match(html, /正解打牌を判定する戦略judgeではありません/);
  assert.match(html, /canonical HOLDを解除できません/);
});

test("Public Beta handoff display identifies D0023 state and next-closure routes", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("styles.css")]);

  assert.match(html, /D0023 \/ FOUNDER-INDEPENDENT HANDOFF/);
  assert.match(html, /id="closure-map-title"/);
  assert.match(html, /CLOSED/);
  assert.match(html, /OPEN/);
  assert.match(html, /UNKNOWN/);
  assert.match(html, /HOLD/);
  assert.match(html, /Qualified mahjong expert \/ Human domain Authority/);
  assert.match(html, /Integration operator \+ resource owners/);
  assert.match(html, /Human security \/ qualification Authority/);
  assert.match(html, /Named Human release \/ legal Authority/);
  assert.match(html, /NEXT CLOSURE POINT SHOULD BE IDENTIFIABLE/);
  assert.match(css, /\.next-closure-grid/);
  assert.match(css, /\.handoff-states/);
});
