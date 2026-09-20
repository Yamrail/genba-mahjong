import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public explanation preserves all Human/AI root-value boundaries", async () => {
  const [html, readme, contract] = await Promise.all([
    read("index.html"),
    read("README.md"),
    read("PROJECT_CONTRACT.md"),
  ]);
  const publicText = `${html}\n${readme}`;
  const required = [
    "SAFE COLLABORATION INFRASTRUCTURE",
    "HYPOTHESIS_AND_MEASUREMENT_SUPPORT",
    "EVIDENCE != JUDGMENT != AUTHORITY",
    "WORKER CONSENSUS != AUTHORITY",
    "COMMON COMMUNICATION BASE != UNIVERSAL JUDGE",
  ];
  for (const invariant of required) {
    assert.match(publicText, new RegExp(invariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(contract, new RegExp(invariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(publicText, /Public Beta/i);
  assert.match(publicText, /GA[^\n]{0,40}HOLD|GA[^\n]{0,40}ではありません/i);
});

test("runtime is self-contained and does not silently persist or call external services", async () => {
  const [html, app, engine] = await Promise.all([
    read("index.html"),
    read("src/app.js"),
    read("src/engine.js"),
  ]);
  const runtime = `${html}\n${app}\n${engine}`;
  assert.doesNotMatch(runtime, /<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(runtime, /<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(runtime, /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(runtime, /\b(localStorage|sessionStorage|indexedDB|document\.cookie|serviceWorker)\b/);
});

test("known HOLD publication is present and cannot be mistaken for GA", async () => {
  const [html, holds] = await Promise.all([
    read("index.html"),
    read("docs/KNOWN_HOLDS.md"),
  ]);
  for (const marker of ["Real AI", "Human identity", "GA", "UNKNOWN", "HOLD"]) {
    assert.match(`${html}\n${holds}`, new RegExp(marker, "i"));
  }
  assert.match(holds, /PUBLIC BETA != GA/);
  assert.match(holds, /LOCAL FIXTURE ACTION != CANONICAL AUTHORITY/);
});
