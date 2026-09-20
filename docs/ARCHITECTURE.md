# Architecture and D0021 rework map

## System boundary

現場麻雀Public Betaは、静的HTML/CSS/JavaScriptとブラウザ内state machineだけで構成します。
外部API、AI provider、認証service、database、analytics、cookie、service workerは使用しません。

```text
fixture controls
  -> instance-scoped engine
  -> typed event/state projection
  -> user-visible indication

AI fixture proposal --X--> Human judgment
AI fixture consensus --X--> discard / HOLD release / Authority

Human explicit judgment
  -> separate Human action confirmation
  -> local educational receipt only
```

## D0021 eight-layer mapping

| Layer | Public Beta construction |
|---|---|
| Connection | Structured input validation; registry lifecycle is ingested by the runtime; invalid controls return local HOLD results. |
| Contamination | No module-global journal, coordinates, registry, worker, or decision state. |
| Isolation | Every engine instance has a session ID and private state; exported receipts preserve that namespace. |
| Load / Thermal | Retained events are bounded; old events are compacted into a replayable checkpoint with counters. |
| Lifecycle | Revocation/supersession are irreversible; authority/evidence epochs are monotonic; stale leases cannot revive after rollback input. |
| Proximity | Worker resource vectors are compared even when no direct worker edge exists. |
| Protection coordination | HOLD, retry, Human gate, unknown control, and local isolation return explicit typed states without silent fallback. |
| Common mode | Shared provider/auth/cache/dataset/runtime/rule source prevents an `INDEPENDENT` result. |

## Semantic state model

The canonical display categories are not collapsed into a score:

```text
OBSERVED
INFERENCE
HYPOTHESIS
COUNTEREXAMPLE
UNKNOWN
HOLD
AI_ADVISORY
HUMAN_JUDGMENT
HUMAN_AUTHORITY_ACTION
```

`HUMAN_AUTHORITY_ACTION` in this fixture means an explicit local browser action. It is deliberately
shown with the warning `IDENTITY_NOT_VERIFIED / CANONICAL_EFFECT_NONE`.

## History and replay

Events use a monotonic sequence within a session. When the retained tail reaches its configured
limit, the engine advances a checkpoint containing only the minimum replay state and aggregate
counters. Replaying `checkpoint + retained events` must reproduce the same current state.

The receipt is an inspectable teaching artifact, not a cryptographic signature or canonical evidence seal.

## Shared-resource model

Each worker proposal carries a resource vector:

```text
provider / auth / cache / dataset / runtime / ruleSource
```

Any overlap yields a correlated/common-mode result. Missing metadata yields UNKNOWN/HOLD. Only complete,
disjoint vectors may be called fixture-independent. Even then, agreement remains advisory.

## No hidden escalation

The engine has no method that lets a worker:

- record Human judgment;
- authorize a discard;
- release a HOLD;
- change release class; or
- acquire identity/qualification Authority.

Those transitions require separate Human-facing controls and never close canonical project HOLDs.

