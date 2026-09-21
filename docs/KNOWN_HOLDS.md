# Known HOLDs — Public Beta

公開は、技術的PASS、GA、専門家受入、または既存HOLDの解除を意味しません。

| ID | State | Public Betaでの扱い | Qualified closer | Next closure point / required Evidence |
|---|---|---|---|---|
| `PB-H01-REAL-AI` | HOLD | 外部AI/model/providerを呼び出さない。fixture出力だけを表示する。 | Human product/release Authority + provider owner | provider契約とfailure boundaryを定義し、real interfaceでD0021八層・revoke・fault-injectionを別資格化する。 |
| `PB-H02-HUMAN-IDENTITY` | HOLD | ブラウザ操作は本人確認・資格・署名の証明ではない。 | Human security/qualification Authority | identity・capability・revoke手順を選び、authorized/unauthorized/revokedの反例receiptを得る。 |
| `PB-H03-CANONICAL-HOLD-RELEASE` | HOLD | 画面上の局所操作はcanonical/project HOLDを解除しない。 | named YamRail Human Authority | fixture外で根拠をjudgmentし、append-only canonical record/DeltaとしてHOLD releaseを明示する。 |
| `PB-H04-MAHJONG-CORRECTNESS` | UNKNOWN | 正解打牌・勝率・専門的牌効率を判定しない。 | qualified mahjong domain expert / Authority | acceptance corpus、value vector、反例、許容誤差をHumanが定義してdomain reviewする。 |
| `PB-H05-LIVE-SHARED-RESOURCES` | HOLD | 実provider/auth/cache/queue障害は未通電。共有資源はsynthetic metadataで試験する。 | integration operator + service/resource owners | canonical resource ID registryを結線し、provider/auth/cache/dataset/runtime/rule-sourceの共有故障を注入する。 |
| `PB-H06-LONG-RUN-PRODUCTION` | HOLD | bounded journalのsynthetic load試験のみ。production負荷・multi-tab競合は未認定。 | operations/performance owner | memory、latency、multi-tab、restart、長時間閾値を定義し、production-like soak receiptを取得する。 |
| `PB-H07-ACCESSIBILITY-DEVICES` | HOLD | semantic HTMLとkeyboard/mobile設計は実装するが、全実機・支援技術網羅は未検収。 | accessibility reviewer + affected-user acceptance | keyboard、screen reader、zoom、contrast、mobile実機matrixを定義して検収する。 |
| `PB-H08-GA` | HOLD | Public Betaのみ。GA Authority・production acceptanceなし。 | named Human release Authority | applicable HOLD/UNKNOWNを個別判断し、GA scopeとproduction acceptanceを別のAuthority receiptで発行する。 |
| `PB-H09-LICENSE` | UNKNOWN | 公開可視性のみ。再利用licenseはHumanが未選択。 | Human legal/product Authority | licenseまたはno-license方針を選択し、LICENSE/SPDXと説明を明示する。 |
| `PB-H10-PRIVATE-QUALIFICATION` | HOLD | private T01–T12 + FlowをPublic Beta PASSへ転記しない。 | canonical qualification Authority | current routeをFreshSessionで再資格化し、T01–T12 + Flowのcanonical receiptを別途得る。 |

Private qualification campaignのT01–T12 + Flow、real auth、live service、collector、
historical root-cause HOLDは、この公開によって変更・転記・解除されません。

## Handoff state map

| State | Scope |
|---|---|
| `CLOSED` | fixed Public Beta artifactの決定論的教育fixture、境界表示、自己試験、独立照査、remote readbackだけ。 |
| `OPEN` | 公開benchへの再現可能な反例・feedback。現行Public Betaを自動で無効化せず、次delta候補として扱う。 |
| `UNKNOWN` | domain correctnessとlicense。Evidence不足を肯定判断へ変換しない。 |
| `HOLD` | real interface、identity、canonical release、live/production qualification、accessibility、private qualification、GA。 |

```text
FOUNDER CAN DO IT != SYSTEM CAN REPRODUCE IT
PUBLIC REPO != SELF-SERVICE
NEXT CLOSURE POINT SHOULD BE IDENTIFIABLE
```

この表のcloserはAuthority classであり、このfixtureのAI/workerやbrowser利用者を自動で指しません。

```text
PUBLIC BETA AUTHORITY != TECHNICAL PASS
PUBLIC BETA != GA
LOCAL FIXTURE ACTION != CANONICAL AUTHORITY
UNKNOWN/HOLD MUST NOT BE SILENTLY CLOSED
```
