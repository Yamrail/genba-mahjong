# 現場麻雀 — Public Beta

現場麻雀は、複数のAI worker・証拠・仮説・反例・UNKNOWN/HOLDを、
人間が混同せずに扱うための教育用fixture / systems-coherence benchです。

これは麻雀の正解を出すAI、打牌支援サービス、専門家の代替、または
YamRailのGA製品ではありません。外部AIやmodel providerには接続せず、
ブラウザ内の決定論的な例だけを動かします。

## Root value

```text
YAMRAIL = SAFE COLLABORATION INFRASTRUCTURE
AI_MAX_EPISTEMIC_ROLE = HYPOTHESIS_AND_MEASUREMENT_SUPPORT
EVIDENCE != JUDGMENT != AUTHORITY
WORKER CONSENSUS != AUTHORITY
COMMON COMMUNICATION BASE != UNIVERSAL JUDGE
```

AI worker役が行うのは、観測整理、仮説、反例、測定提案までです。
人間判断、打牌、HOLD解除、Authorityは、画面上でも別の操作・別の記録として扱います。

## Public Betaで確認できること

- OBSERVED / INFERENCE / HYPOTHESIS / COUNTEREXAMPLE / UNKNOWN / HOLDの表示分離
- 複数workerの一致とHuman Authorityの非同一性
- provider / auth / cache / dataset / runtime / rule sourceの共有によるcommon-mode検出
- revoke / supersede / epochの履歴再投影
- session間の状態隔離
- 未知controlの局所HOLD化
- 長時間sessionでのbounded journalとcheckpoint
- 明示的なHuman judgment → Human actionの二段階記録

## Handoff status / next closure

D0023のfounder-independent handoff標準に従い、公開repoの存在だけを
self-service成立とは扱いません。

```text
FOUNDER CAN DO IT != SYSTEM CAN REPRODUCE IT
PUBLIC REPO != SELF-SERVICE
NEXT CLOSURE POINT SHOULD BE IDENTIFIABLE
```

| State | このPublic Betaでの意味 | Qualified closer / next closure point |
|---|---|---|
| `CLOSED` | 決定論的な教育fixture、D0022境界表示、固定commit試験と独立照査の範囲 | 公開receiptでfixed commit・試験・remote readbackを照合する。productionや麻雀正解のclosureではない。 |
| `OPEN` | 公開教材/benchとしての利用feedbackと反例追加 | operatorが再現手順付きissueを提示し、maintainerが次のfixture deltaとして評価する。Authority移転は起こらない。 |
| `UNKNOWN` | 麻雀の正解、完全な牌効率・勝率、再利用license | qualified mahjong domain authorityがacceptance corpus/value vectorを定義し、Human legal/product Authorityがlicenseを選択する。 |
| `HOLD` | real provider、Human identity、canonical HOLD解除、live共有資源、production長時間、実機accessibility、private qualification、GA | 各ownerが[Known HOLDs](docs/KNOWN_HOLDS.md)の測定/手順を完了し、指定Human Authorityが別receiptで閉じる。 |

AI/workerの一致、fixtureの成功、Public Beta公開のいずれも、この表のHuman/domain closureを代行しません。

## 使い方

1. `観測を追加`、`AI worker候補を生成`、`反例を注入`を試します。
2. workerが一致しても、画面は自動で打牌しません。
3. `人間判断を記録`で候補と理由を入力します。
4. 別操作の`打牌を確定`は、ブラウザ利用者の明示操作としてだけ記録されます。
5. receiptをJSONで書き出し、表示stateとevent historyを照合できます。

ブラウザ上のHuman操作は、本人確認・資格・署名を証明しません。canonical YamRail
HOLDや実作業Authorityを解除するものでもありません。

## ローカル実行

```bash
npm test
npm run serve
```

表示されたURLをブラウザで開いてください。依存packageのinstallは不要です。

## Release boundary

- Release: `0.1.0-beta.1 / PUBLIC BETA`
- GA: `HOLD`
- Real AI/model/provider invocation: `HOLD / NOT CONNECTED`
- Human identity/capability authentication: `HOLD / NOT IMPLEMENTED`
- Canonical HOLD release: `NOT AVAILABLE`
- Production suitability: `NOT ESTABLISHED`
- Public visibility is not a software-license grant; licensing remains `UNKNOWN`.

詳細は [既知HOLD](docs/KNOWN_HOLDS.md)、[architecture](docs/ARCHITECTURE.md)、
[public provenance](docs/PROVENANCE.md) を参照してください。
