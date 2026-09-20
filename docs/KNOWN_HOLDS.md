# Known HOLDs — Public Beta

公開は、技術的PASS、GA、専門家受入、または既存HOLDの解除を意味しません。

| ID | State | Public Betaでの扱い |
|---|---|---|
| `PB-H01-REAL-AI` | HOLD | 外部AI/model/providerを呼び出さない。fixture出力だけを表示する。 |
| `PB-H02-HUMAN-IDENTITY` | HOLD | ブラウザ操作は本人確認・資格・署名の証明ではない。 |
| `PB-H03-CANONICAL-HOLD-RELEASE` | HOLD | 画面上の局所操作はcanonical/project HOLDを解除しない。 |
| `PB-H04-MAHJONG-CORRECTNESS` | UNKNOWN | 正解打牌・勝率・専門的牌効率を判定しない。 |
| `PB-H05-LIVE-SHARED-RESOURCES` | HOLD | 実provider/auth/cache/queue障害は未通電。共有資源はsynthetic metadataで試験する。 |
| `PB-H06-LONG-RUN-PRODUCTION` | HOLD | bounded journalのsynthetic load試験のみ。production負荷・multi-tab競合は未認定。 |
| `PB-H07-ACCESSIBILITY-DEVICES` | HOLD | semantic HTMLとkeyboard/mobile設計は実装するが、全実機・支援技術網羅は未検収。 |
| `PB-H08-GA` | HOLD | Public Betaのみ。GA Authority・production acceptanceなし。 |
| `PB-H09-LICENSE` | UNKNOWN | 公開可視性のみ。再利用licenseはHumanが未選択。 |

Private qualification campaignのT01–T12 + Flow、real auth、live service、collector、
historical root-cause HOLDは、この公開によって変更・転記・解除されません。

```text
PUBLIC BETA AUTHORITY != TECHNICAL PASS
PUBLIC BETA != GA
LOCAL FIXTURE ACTION != CANONICAL AUTHORITY
UNKNOWN/HOLD MUST NOT BE SILENTLY CLOSED
```

