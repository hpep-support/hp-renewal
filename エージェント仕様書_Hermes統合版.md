# エージェント仕様書：コミュニティAI「Hermes」— グラフメンテナンス機能

本書は、企画書で構想したコミュニティAI「Hermes」のうち、**コミュニティ活動可視化プラットフォームのネットワークグラフ（ノード・リンク）を自律的に維持・成長させる機能**の設計仕様を定義する。Hermesは単一の巨大なAIとしてではなく、疎結合な複数のサブエージェントが協調して動く体系として実装し、本書ではそのうちグラフメンテナンスを担う3つのサブエージェントを扱う。

> Hermesにはもう一つの機能領域として、企画書7〜8章で定義した「クローズドコミュニティでの心理的安全性を保ったモニタリング・相乗効果検出」がある。こちらは引き続きMVPのフェーズ2以降で実装する対象であり、本書の対象外とする。ただし、両機能は同じ「Hermes」という一つの人格・設計原則を共有するため、次節でその原則を明記する。

---

## 1. 概要と設計思想

ネットワークグラフは、ユーザーが手動で入力したコンテキストからAIが抽出した情報で構成されている。しかし、以下の課題が発生する：

1. **情報の鮮度劣化** — 人物の所属や役職、プロジェクトのステータスは時間とともに変化するが、過去のコンテキストは更新されない。
2. **情報の矛盾・誤り** — 同一人物の表記揺れの取りこぼし、誤ったリンク、古い情報と新しい情報の矛盾が蓄積する。
3. **情報の網羅性不足** — ユーザーが入力を怠ると、グラフの成長が止まる。公開情報から補完可能な内容も反映されない。

これらを解決するため、**コミュニティAI「Hermes」を、以下の3つの専門サブエージェントの集合体として実装する**。将来の拡張として先送りするのではなく、MVPの時点から「Hermes」という一つの名前・一つの設計原則のもとで動く体系とする。各サブエージェントは **独立したジョブとして非同期実行** され、既存のAPI/DBを通じてグラフを更新する。人間（オーナー）の承認フローを組み込み、エージェントが勝手に誤った変更を確定させないようにする。
さらに、Hermesが収集・修正した構造化データ（プロジェクト、人物、テーマ等）は、将来的に**パブリック出力層となる公式HP（ヘッドレスCMS経由）へシームレスに連携**され、社会へ発信するデータ駆動型可視化基盤のコアエンジンとしても機能する。

```
┌───────────────────────────────────────────────────────────────┐
│                  コミュニティAI「Hermes」                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Community Network Graph                     │  │
│  │   (Contexts, Entities, Links / extracted_entities)       │  │
│  └────────────┬────────────┬────────────┬──────────────────┘  │
│               │            │            │                     │
│       ┌───────▼──┐  ┌──────▼─────┐  ┌──▼──────────────┐       │
│       │ Agent 1  │  │  Agent 2   │  │    Agent 3       │       │
│       │ 日時解決 │  │ 矛盾修正  │  │  情報収集        │       │
│       │ (Time    │  │ (Error     │  │  (Discovery      │       │
│       │ Resolver)│  │ Corrector) │  │   Crawler)       │       │
│       └────┬─────┘  └─────┬──────┘  └───┬──────────────┘       │
│            │              │              │                     │
│       ┌────▼──────────────▼──────────────▼──┐                  │
│       │         Agent Tool Layer            │                  │
│       │  (DB Access, Web Search, LLM, etc.) │                  │
│       └─────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Hermesとしての設計原則

グラフメンテナンスを行うこれら3つのサブエージェントも、企画書7〜8章で定義したHermesの設計原則を踏襲する。

- **発見支援型であり、評価・監視ではない**：矛盾修正や情報収集は「情報を正確・最新に保つための支援」であり、対象人物を評価・監視する目的では用いない。
- **対象者への透明性**：エンティティに対する変更提案には、必ず `reasoning`（理由）と `evidence_urls`（根拠）を記録し、誰が見ても「なぜその変更が提案されたか」を追跡できるようにする。
- **人間の最終判断**：矛盾修正・情報収集エージェントの提案は原則すべてオーナー承認を経る（詳細は2.2節）。日時解決のみ、明示的な日付が本文中にある場合に限り自動適用を許可する。
- **対象範囲の限定**：情報収集は公開情報に限定し、クローズドコミュニティの非公開投稿や個人間のやり取りは対象としない（詳細は5節・8節）。
- **同意に基づく個人情報の取り扱い**：人物エンティティに対する外部情報収集は、本人が同意した場合に限る（詳細は5.2節・2.1.2節）。

---

## 2. 共通基盤

### 2.1 データモデルの拡張

エージェントの動作を支えるため、既存のデータモデルに以下の拡張を行う。

#### 2.1.1 Context テーブルへの追加カラム

| カラム名 | 型 | 説明 |
|---|---|---|
| `info_date` | `DateTime` | 情報の実際の日時（記事の発行日、イベントの開催日など）。`NULL` の場合はエージェントが推定または探索する対象。 |
| `info_date_source` | `String(50)` | 日時の出典。`"explicit"`（テキスト内に明記）, `"inferred"`（前後の情報から推定）, `"post_date"`（エージェント投稿日を利用）, `"unknown"`（未解決） |
| `revision` | `Integer` | 改版番号。初回 = 1。エージェントによる修正のたびにインクリメント。 |
| `source_agent` | `String(50)` | このコンテキストを作成/最終更新したエージェントの識別子。`NULL` = ユーザー手動入力。Hermesのいずれかのサブエージェントの場合は `"hermes.time_resolver"` のように記録する。 |

#### 2.1.2 Entity テーブルへの追加カラム

| カラム名 | 型 | 説明 |
|---|---|---|
| `last_verified_at` | `DateTime` | エージェントが最後にこのエンティティの情報を検証した日時。 |
| `info_date` | `DateTime` | このエンティティに関する情報の基準日時。 |
| `confidence` | `Float` | 情報の確信度 (0.0〜1.0)。エージェントが推定した情報は低い値になる。 |
| `external_enrichment_opt_in` | `Boolean` | `entity_type = "person"` の場合に、本人の同意によりHermesの情報収集（Discovery Crawler）の対象に含めるかどうか。デフォルトは `false`（対象外）。`project`／`organization` には適用せず、常に収集対象になりうる。 |

#### 2.1.3 新規テーブル: `agent_proposals`（エージェント提案）

エージェントが行った変更提案を保持し、オーナーの承認を待つキュー。

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | `Integer` (PK) | |
| `agent_type` | `String(50)` | `"time_resolver"`, `"error_corrector"`, `"discovery_crawler"` |
| `proposal_type` | `String(50)` | `"update_date"`, `"fix_entity"`, `"fix_link"`, `"add_context"`, `"add_entity"` |
| `target_entity_id` | `Integer` (FK, nullable) | 対象の Entity ID |
| `target_context_id` | `Integer` (FK, nullable) | 対象の Context ID |
| `affects_person_id` | `Integer` (FK, nullable) | この提案が特定の人物エンティティの表現に直接影響する場合の Entity ID。設定されている場合、オーナー承認に加えて本人への通知対象となる（2.2節）。 |
| `current_value` | `Text` | 変更前の値（JSON形式） |
| `proposed_value` | `Text` | 変更後の値（JSON形式） |
| `reasoning` | `Text` | エージェントがこの提案をした理由の説明 |
| `evidence_urls` | `Text` | 根拠となるソースURL（JSON配列） |
| `status` | `String(20)` | `"pending"`, `"approved"`, `"rejected"`, `"auto_applied"` |
| `created_at` | `DateTime` | 提案日時 |
| `reviewed_at` | `DateTime` | 承認/却下日時 |
| `reviewed_by` | `Integer` (FK, nullable) | 承認したユーザーのID |

### 2.2 承認フロー

```
エージェントが変更を検出
        │
        ▼
  agent_proposals に INSERT (status = "pending")
        │
        ▼
  ┌─ 信頼度が高い？（confidence ≥ 0.9 かつ軽微な変更）
  │     YES ──▶ 自動適用 (status = "auto_applied")
  │     NO  ──▶ オーナーに通知、ダッシュボードに表示
  └─────────────▶ オーナーが "Approve" / "Reject"
                          │
                    Approve ──▶ 変更をDBに反映、revision++
                    Reject  ──▶ status = "rejected"
```

> **自動適用の基準**（安全側に寄せる）：
> - 日時解決エージェント：テキスト中に明示的な日付がある場合の `info_date` 設定
> - 矛盾修正エージェント：自動適用なし（すべてオーナー承認）
> - 情報収集エージェント：自動適用なし（すべてオーナー承認）

> **本人への通知（Hermesの「対象者への透明性」原則）**：`affects_person_id` が設定された提案は、オーナーの承認可否とは別に、対象人物が同一コミュニティのユーザーである場合は本人にも通知する。自動適用された場合も例外なく通知する。これにより、自分に関する情報がどのように記録・修正されたかを本人が常に把握できるようにする。

### 2.3 共通ツール一覧

全エージェントが利用可能なツール（関数）群。

| ツール名 | 説明 | 入力 | 出力 |
|---|---|---|---|
| `db_query_contexts` | コンテキスト一覧の取得（フィルタ付き） | `filters: {owner_id, date_range, has_info_date, ...}` | `Context[]` |
| `db_query_entities` | エンティティ一覧の取得 | `filters: {entity_type, name_pattern, ...}` | `Entity[]` |
| `db_query_links` | 2つのエンティティ間のリンク情報取得 | `source_id, target_id` | `Link[]` |
| `db_create_proposal` | 変更提案を作成 | `AgentProposal` | `proposal_id` |
| `db_apply_proposal` | 承認済み提案をDBに反映 | `proposal_id` | `success/failure` |
| `notify_subject` | `affects_person_id` に該当するユーザーへ通知を送る | `person_entity_id, proposal_id` | `success/failure` |
| `triple_extract` | 文章を (主語, 述語, 目的語) のトリプルに分解する | `context_id, text` | `Triple[]` |
| `llm_analyze` | Gemini APIにテキストを送信して分析結果を取得 | `prompt, text, ?image` | `string (JSON)` |
| `web_search` | Web検索（Google Search API等）を実行 | `query, ?site, ?date_range` | `SearchResult[]` |
| `web_scrape` | URLからテキスト内容を取得 | `url` | `string` |
| `date_extract` | テキストから日付表現を抽出・正規化 | `text` | `{date, source, confidence}[]` |

### 2.4 文章のトリプル化（Triple抽出基盤）

> 「各文章をトライポッドに変換する」というご要望は、グラフデータベースでの標準的な表現形式である **トリプル（主語-述語-目的語、Subject-Predicate-Object）** への変換を指すものと解釈して仕様化する。

現在、Contextから抽出された関係性は `extracted_entities` という緩い形式のJSONで保持されているが、これを **1文ごとに複数のトリプルへ正規化** することで、以下の3つのサブエージェントすべての精度を底上げできる。

#### 2.4.1 なぜ必要か

- **日時解決の粒度向上**（3節）：1つのContextに複数の事実が含まれる場合（例:「1995年に三井信託銀行に入行し、2002年にカメガヤへ入社した」）、現状は `info_date` がContext単位でしか持てず、どちらの日付か曖昧になる。トリプル単位で `info_date` を持たせることで、事実ごとに正確な日時を割り当てられる。
- **矛盾検出の精度向上**（4節）：同一の `(subject_entity_id, predicate)` を持つトリプル同士で `object` が異なれば、それは直接的な矛盾候補になる。現状のようにLLMに文章全体を渡して矛盾を推測させるより、機械的かつ高精度に矛盾を検出できる。
- **重複検出の精度向上**（5節）：新規収集した記事をトリプル化し、既存トリプルと突き合わせることで、URLが違うだけで内容が重複する情報も検出できる。
- **グラフの可読性向上**：トリプルの `predicate`（述語）を、ネットワークグラフのリンクにラベルとして表示できるようになる（例:「所属」「卒業」「登壇」）。これは見やすさ改善のために導入したエンティティ種別の凡例（H7・H8）と同様に、リンクそのものの意味を一目で伝える効果がある。

#### 2.4.2 データモデル：`Triple` テーブル（新規）

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | `Integer` (PK) | |
| `context_id` | `Integer` (FK) | このトリプルの抽出元となったContext |
| `subject_entity_id` | `Integer` (FK) | 主語となるEntity |
| `predicate` | `String(100)` | 関係を表す述語（例:「所属した」「卒業した」「登壇した」「投資した」） |
| `object_entity_id` | `Integer` (FK, nullable) | 目的語がEntityの場合 |
| `object_literal` | `String(255)` (nullable) | 目的語が数値・日付・単純な文字列などEntity化しない値の場合（例:「51案件」「67億円」） |
| `info_date` | `DateTime` (nullable) | このトリプル固有の情報日時。Contextの `info_date` より細かい粒度を持つ |
| `confidence` | `Float` | 抽出の確信度 |
| `source_agent` | `String(50)` | 抽出元。ユーザー入力時のLLM抽出なら `"triple_extractor"` |
| `revision` | `Integer` | 改版番号 |

#### 2.4.3 抽出フロー

```
[1] 新規Contextが登録された（または既存Contextの再処理時）
        │
        ▼
[2] triple_extract ツールでLLMに文章を渡し、事実を (主語, 述語, 目的語) に分解
    例: "亀ヶ谷さんは1972年、神奈川県生まれ。青山学院大学経営学部を卒業後、
         三井信託銀行（現・三井住友信託銀行）に入行しました。"
    → (亀ヶ谷正信, 生年, 1972年)
    → (亀ヶ谷正信, 出身地, 神奈川県)
    → (亀ヶ谷正信, 卒業した, 青山学院大学経営学部)
    → (亀ヶ谷正信, 入行した, 三井信託銀行)
        │
        ▼
[3] 主語・目的語の文字列を既存Entityと照合（表記揺れがあれば4.3.1の統合ロジックを再利用）
    一致するEntityがなければ新規Entity候補として作成（オーナー承認待ち）
        │
        ▼
[4] 各トリプルについて日時解決エージェント（3節）で info_date を個別に解決
        │
        ▼
[5] Triple テーブルに保存。同一 (subject_entity_id, predicate) で object が異なる
    既存トリプルがあれば、矛盾修正エージェント（4節）に矛盾候補として引き渡す
```

#### 2.4.4 既存の3エージェントへの反映

- **日時解決エージェント（3節）**：処理対象を「`info_date` が `NULL` のContext」から「`info_date` が `NULL` のTriple」に拡張し、トリプル単位で日時を解決する。
- **矛盾修正エージェント（4節）**：4.3.2節の「属性の矛盾検出」は、まず `(subject_entity_id, predicate)` が一致し `object` が異なるTripleの組を機械的に抽出し、それでも判断がつかない場合のみLLMによる文脈判定（時系列判断・Web裏取り）に進む、という2段階の処理に変更する。
- **情報収集エージェント（5節）**：新規記事を要約するだけでなく `triple_extract` にかけ、既存Tripleとの重複（`subject_entity_id` と `predicate` が一致し `object`も実質同じ）を検出してからContext追加提案を作成する。

#### 2.4.5 MVPでの簡略化

初期実装では、述語（`predicate`）はLLMが自由記述したテキストのままとし、あらかじめ定めた語彙への正規化（オントロジー化）は行わない。表記揺れの多い述語（「入行した」「入社した」等）の統合は、4.3.1節のエンティティ名統合ロジックと同様の仕組みを述語にも適用する形で、フェーズ2以降に拡張する。

---

## 3. Hermesサブエージェント1: 日時解決（Time Resolver）

### 3.1 目的

全ての情報（コンテキストの要素）に **情報日時・更新日時・改版** が存在することを保証する。

### 3.2 トリガー

- **新規コンテキスト登録時**：`info_date` が `NULL` のコンテキストが作成された直後
- **定期バッチ**：1日1回、`info_date = NULL` または `info_date_source = "unknown"` のコンテキストを全件走査

### 3.3 処理フロー

```
[1] info_date が NULL のコンテキストを取得
        │
        ▼
[2] テキスト本文から日付表現を抽出 (date_extract ツール)
    例: "2026年8月25日", "August 25 at 8:32 AM", "先週の月曜日"
        │
    ┌── 日付が見つかった？
    │     YES ──▶ [3a] info_date を設定, info_date_source = "explicit"
    │                  confidence = 0.95
    │                  → 自動適用（db_create_proposal + auto_apply）
    │
    │     NO ──▶ [3b] resource_url が存在する？
    │              YES ──▶ [4] URLの記事から日付を取得 (web_scrape + date_extract)
    │                       見つかれば info_date_source = "explicit", confidence = 0.9
    │              NO ──▶ [5] 前後のコンテキストから推定
    │                       同一 owner_id のコンテキストを created_at 順で取得
    │                       前後の info_date の中間値を推定値とする
    │                       info_date_source = "inferred", confidence = 0.5
    │                       → 提案としてキューに入れる（オーナー承認待ち）
    │
    └── [6] それでも解決できない場合
              source_agent によるエージェント投稿なら created_at を利用
              info_date_source = "post_date", confidence = 0.7
              → 提案としてキューに入れる
```

### 3.4 専用ツール

| ツール名 | 説明 |
|---|---|
| `date_extract` | 自然言語の日付表現（日本語・英語対応）をISO 8601形式に変換。相対表現（「先週」「3日前」）は基準日からの計算にも対応。 |
| `date_infer_from_neighbors` | 前後のコンテキストの `info_date` を参照し、時系列的に妥当な日時を推定。 |

### 3.5 出力例

```json
{
  "agent_type": "time_resolver",
  "proposal_type": "update_date",
  "target_context_id": 8,
  "current_value": "{\"info_date\": null, \"info_date_source\": \"unknown\"}",
  "proposed_value": "{\"info_date\": \"2026-08-25T08:32:00+09:00\", \"info_date_source\": \"explicit\"}",
  "reasoning": "コンテキスト本文中に 'August 25 at 8:32 AM' という日付表現を検出しました。",
  "evidence_urls": "[]",
  "status": "auto_applied"
}
```

---

## 4. Hermesサブエージェント2: 矛盾修正（Error Corrector）

### 4.1 目的

ノード情報やリンクに含まれる矛盾・誤りを検出し、正しい情報に修正する提案を行う。

### 4.2 トリガー

- **定期バッチ**：1日1回、全エンティティおよびリンクを走査
- **新規コンテキスト登録時**：新しく抽出されたエンティティが既存ノードと矛盾する場合

### 4.3 検出対象と処理フロー

#### 4.3.1 表記揺れの検出・統合

```
[1] 全 Entity の名前リストを取得
        │
        ▼
[2] LLM に名前リストを渡し、同一人物/組織と思われるペアを検出
    例: "長谷川 秀夫" と "長谷川秀夫"（スペース揺れ）
        "東京大学" と "東大"（略称）
        "Keiko Kimura" と "木村恵子"（日英表記）
        │
        ▼
[3] 各ペアについて、統合提案を作成
    merged_into_id を使って片方を正規表現に統合
    → 提案をキューに入れる（オーナー承認待ち）
```

#### 4.3.2 属性の矛盾検出

```
[1] 同一エンティティを subject_entity_id とする Triple 群を取得
        │
        ▼
[2] (subject_entity_id, predicate) が一致し、object が異なる Triple の組を機械的に抽出
    例: (亀ヶ谷正信, 所属, A社) と (亀ヶ谷正信, 所属, B社) が併存
    ※ Triple化されていない旧来のContextは、従来通りLLMに全文を渡して矛盾を検出する
        │
        ▼
[3] 矛盾の解決方針を判断
    - 各Tripleの info_date を比較し、時系列で新しい方を正とする（転職・異動の可能性）
    - 日時が不明・同時期の場合はLLMによる文脈判定、必要ならWeb検索で裏取り
        │
        ▼
[4] 修正提案を作成 → キューに入れる
        │
        ▼
[5] 対象が人物エンティティの場合、affects_person_id を設定する
    → オーナー承認に加え、本人が同一コミュニティのユーザーであれば通知する
       （Hermesの「対象者への透明性」原則、2.2節参照）
```

#### 4.3.3 誤リンクの検出

```
[1] extracted_entities 内のリンク（source-target ペア）を全件走査
        │
        ▼
[2] LLM に各リンクの元テキストを渡し、リンクの妥当性を評価
    例: "山田太郎" → "東京タワー" は文脈上リンクすべきではない
        │
        ▼
[3] 不適切なリンクについて
    - 削除提案（type: "fix_link"）
    - または正しいターゲットへの再リンク提案
    → キューに入れる（オーナー承認待ち）
```

### 4.4 専用ツール

| ツール名 | 説明 |
|---|---|
| `detect_name_variants` | エンティティ名リストを受け取り、LLMで同一性判定を行う。類似度スコアと統合候補を返す。 |
| `detect_contradictions` | 同一エンティティに関する複数コンテキストを受け取り、矛盾する記述を検出・列挙する。 |
| `validate_link` | source-target-context の3つ組を受け取り、リンクの妥当性を0.0〜1.0で評価する。 |

### 4.5 出力例

```json
{
  "agent_type": "error_corrector",
  "proposal_type": "fix_entity",
  "target_entity_id": 42,
  "affects_person_id": null,
  "current_value": "{\"name\": \"東京大\", \"entity_type\": \"organization\"}",
  "proposed_value": "{\"action\": \"merge_into\", \"canonical_entity_id\": 15, \"canonical_name\": \"東京大学\"}",
  "reasoning": "「東京大」はEntity#15「東京大学」の略称と判断しました。同一組織として統合することを提案します。",
  "evidence_urls": "[\"https://www.u-tokyo.ac.jp/\"]",
  "status": "pending"
}
```

---

## 5. Hermesサブエージェント3: 情報収集（Discovery Crawler）

### 5.1 目的

登録済みの人物ノードおよび関連プロジェクトについて、デイリーで公開情報を収集し、新しい情報があればノード/コンテキストを追加する。

### 5.2 対象範囲の制約（オプトイン）

Hermesの「同意に基づく個人情報の取り扱い」原則に基づき、本エージェントの対象範囲は以下のように制限する。

- `entity_type = "project"` または `"organization"`：常に収集対象とする。
- `entity_type = "person"`：`external_enrichment_opt_in = true` の場合のみ収集対象とする。本人が同意していない人物エンティティについては、Discovery Crawlerは一切の検索・収集を行わない。

### 5.3 トリガー

- **デイリーバッチ**：毎日1回（深夜等の低負荷時間帯）

### 5.4 処理フロー

```
[1] 全 Entity を取得
    entity_type = "project" / "organization" は無条件に対象
    entity_type = "person" は external_enrichment_opt_in = true のみ対象
        │
        ▼
[2] 各 Entity について Web 検索を実行
    検索クエリの生成ルール：
    - Person: "{名前} {関連プロジェクト名}" / "{名前} 最新 活動"
    - Project: "{プロジェクト名} 最新情報 ニュース"
    - Organization: "{組織名} ニュース プレスリリース"
    ※ 直近7日以内の情報に限定（date_range フィルタ）
        │
        ▼
[3] 検索結果のスクリーニング
    - 既にコンテキストとして登録済みの URL は除外
    - resource_url との重複チェック
    - 記事をtriple_extractにかけ、既存Tripleと (subject_entity_id, predicate, object) が
      実質的に一致するものがあれば、URLが異なっていても重複とみなし除外する
        │
        ▼
[4] 新しい記事/情報が見つかった場合
    web_scrape でテキスト取得
        │
        ▼
[5] LLM で関連性を判定
    「この記事は {Entity名} のコミュニティ活動に関連するか？」
    関連度スコア (0.0〜1.0) を取得
        │
    ┌── 関連度 ≥ 0.6？
    │     YES ──▶ [6] 新規コンテキスト追加の提案を作成
    │              context_type = "asis"
    │              source_agent = "hermes.discovery_crawler"
    │              body = LLM による要約テキスト
    │              resource_url = 元記事URL
    │              info_date = 記事の発行日
    │              affects_person_id = 対象が人物エンティティなら設定
    │              → 提案をキューに入れる（オーナー承認待ち、対象人物にも通知）
    │
    │     NO ──▶ スキップ（ログに記録）
    └──
```

### 5.5 収集対象の優先度

| 優先度 | 対象 | 頻度 | 理由 |
|---|---|---|---|
| 高 | `degree` が高いエンティティ（ハブノード） | 毎日 | コミュニティの中心人物・プロジェクトの動向は最も重要 |
| 中 | 直近30日以内に追加/更新されたエンティティ | 毎日 | 新鮮な情報ほど追加情報が見つかりやすい |
| 低 | `last_verified_at` が30日以上前のエンティティ | 週1回 | 古い情報の定期リフレッシュ |

※ いずれの優先度でも、`person` エンティティは 5.2節のオプトイン条件を満たすものに限る。

### 5.6 API利用量の制御

- **1日あたりの Web 検索上限**: 100クエリ（設定で変更可能）
- **1日あたりの LLM 呼び出し上限**: 200リクエスト
- **1バッチあたりの最大処理エンティティ数**: 50
- エンティティは `degree` 降順（重要度順）に処理し、上限に達したら残りは翌日に繰り越す

### 5.7 専用ツール

| ツール名 | 説明 |
|---|---|
| `generate_search_queries` | Entity情報から最適な検索クエリを複数パターン生成する。 |
| `check_url_duplicate` | URLが既存のコンテキスト（`resource_url`）に登録済みかチェックする。 |
| `summarize_article` | Webページのテキストをコミュニティ活動に関連する内容に絞って要約する。 |
| `assess_relevance` | 記事テキストとEntity名を受け取り、関連度スコアを返す。 |

### 5.8 出力例

```json
{
  "agent_type": "discovery_crawler",
  "proposal_type": "add_context",
  "target_entity_id": 7,
  "affects_person_id": 7,
  "current_value": "null",
  "proposed_value": "{\"body\": \"亀ヶ谷正信氏が登壇した『未病EXPO 2026』にて、ドラッグストア業界における健康経営の取り組みについて講演。カメガヤの店舗開発部長として、地域密着型の健康支援モデルを紹介した。\", \"context_type\": \"asis\", \"resource_url\": \"https://example.com/mibyou-expo-2026\", \"info_date\": \"2026-09-10T14:00:00+09:00\", \"source_agent\": \"hermes.discovery_crawler\"}",
  "reasoning": "external_enrichment_opt_in が有効な登録済みエンティティ「亀ヶ谷正信」に関する新しい公開情報を検出しました。未病EXPO 2026への登壇記事です。",
  "evidence_urls": "[\"https://example.com/mibyou-expo-2026\"]",
  "status": "pending"
}
```

---

## 6. Hermesの実行基盤

### 6.1 スケジューラ設定

| エージェント | スケジュール | 実行時間帯（目安） |
|---|---|---|
| 日時解決 (Time Resolver) | コンテキスト登録時 + 毎日 02:00 | 即時 / 深夜 |
| 矛盾修正 (Error Corrector) | 毎日 03:00 | 深夜 |
| 情報収集 (Discovery Crawler) | 毎日 04:00 | 深夜 |

### 6.2 実装方式

```python
# backend/app/agents/base.py（イメージ）
class BaseAgent:
    agent_type: str
    
    def run(self):
        """メインの実行ループ"""
        targets = self.gather_targets()
        for target in targets:
            proposals = self.analyze(target)
            for proposal in proposals:
                self.submit_proposal(proposal)
    
    def gather_targets(self) -> list:
        """処理対象を収集"""
        raise NotImplementedError
    
    def analyze(self, target) -> list:
        """対象を分析し提案を生成"""
        raise NotImplementedError
    
    def submit_proposal(self, proposal):
        """提案をDBに保存、自動適用条件を判定。affects_person_idがあれば本人にも通知"""
        ...
```

### 6.3 ログとモニタリング

| 項目 | 説明 |
|---|---|
| `agent_runs` テーブル | 各エージェント実行のログ（開始/終了時刻、処理件数、エラー数） |
| 提案の統計 | pending / approved / rejected / auto_applied の件数をダッシュボードに表示 |
| エラーアラート | エージェント実行失敗時にオーナーに通知 |

---

## 7. ダッシュボード連携（フロントエンド拡張）

### 7.1 提案レビューUI

ダッシュボードに「Hermes Proposals」パネルを追加し、pending 状態の提案をオーナーがレビュー・承認/却下できるUIを提供する。`affects_person_id` が設定された提案には、対象人物にも通知が送られている旨のラベルを表示する。

```
┌────────────────────────────────────────────────────┐
│  🤖 Hermes Proposals (3 pending)                    │
├────────────────────────────────────────────────────┤
│  [Discovery] 亀ヶ谷正信: 未病EXPO 2026登壇記事      │
│  "亀ヶ谷正信氏が登壇した未病EXPO 2026にて..."       │
│  Source: https://example.com/mibyou-expo-2026        │
│  🔔 本人に通知済み                                   │
│                          [✓ Approve] [✗ Reject]     │
├────────────────────────────────────────────────────┤
│  [Time Resolver] Context#12: 日時を推定             │
│  info_date: null → 2026-08-25T08:32:00+09:00       │
│  根拠: 本文中 "August 25 at 8:32 AM"               │
│                          [✓ Approve] [✗ Reject]     │
├────────────────────────────────────────────────────┤
│  [Error Corrector] 「東京大」→「東京大学」に統合    │
│  Entity#42 を Entity#15 に統合                      │
│                          [✓ Approve] [✗ Reject]     │
└────────────────────────────────────────────────────┘
```

### 7.2 エンティティ詳細に表示する情報

ノードをクリックした際のEntity Editorに、エージェント関連情報を追加表示する。

- **情報日時** (`info_date`): いつの情報か
- **最終検証日** (`last_verified_at`): エージェントが最後に確認した日
- **確信度** (`confidence`): 情報の信頼性
- **改版** (`revision`): 何回修正されたか
- **外部情報収集への同意** (`external_enrichment_opt_in`): 人物エンティティの場合、本人がHermesの情報収集対象になることを許可しているか。本人がこの設定をオン/オフできるトグルをEntity Editorに設ける。
- **関係の内訳**：そのエンティティが関わるTripleの一覧（述語ごとの事実）を表示し、グラフ上のリンクにも `predicate` をラベルとして表示する（例:「所属」「卒業」「登壇」）。

### 7.3 ネットワーク図でのエージェント推論の可視化 (Reason Nodes)

エージェントが自律的にノード（ContextやEntity）間をリンクした場合、または推論によって新たな関連性（シナジー）を見出した場合、ネットワークグラフ上でその「接続理由」を直感的に把握できる仕組みを提供する。

- **中間ノード（Reason Node）の挿入**
  - 単純な「ノードA --- ノードB」という直接リンクではなく、「ノードA --- (Reason Node) --- ノードB」という形で、中間に小さな専用ノードを自動生成して描画する。
  - 理由ノードのサイズは通常のノードより少し小さく（例: `nodeVal = 4`）し、色（group）も専用のものにして視覚的に区別する。
- **理由とエージェントタイプの提示**
  - 中間ノードにカーソルを合わせると、「Agent: [エージェントタイプ] / Reason: [具体的な理由]」がラベルとしてポップアップ表示される。
  - これにより、グラフを見るユーザーは「なぜこの2つが繋がっているのか」「どの専門エージェント（ビジネス戦略家、技術アーキテクト等）の視点で結びつけられたのか」をノードをクリックする前に瞬時に理解できる。
  - Hermesの「透明性の原則」をUIレベルで体現する機能となる。

---

## 8. セキュリティとガードレール

| ルール | 詳細 |
|---|---|
| **Hermesとしての一貫性** | 本書のグラフメンテナンス機能と、企画書で定義したクローズドコミュニティ・モニタリング機能は、同じ「Hermes」の設計原則（発見支援型・対象者への透明性・人間の最終判断）を共有する |
| **オーナー承認必須** | 矛盾修正・情報収集エージェントの全ての変更提案はオーナー承認が必要 |
| **自動適用の範囲制限** | 日時解決の「テキスト中に明示的日付がある場合」のみ自動適用を許可 |
| **人物エンティティへの同意** | 情報収集エージェントによる人物エンティティの外部情報収集は、本人が `external_enrichment_opt_in` を有効にした場合のみ許可する |
| **本人への通知** | `affects_person_id` が設定された提案（人物の情報を追加・修正するもの）は、オーナー承認とは別に対象本人にも通知する |
| **レート制限** | Web検索・LLM呼び出しに上限を設定し、API費用の暴走を防止 |
| **ロールバック** | `revision` による改版管理で、任意の変更を取り消し可能にする |
| **プライバシー** | 情報収集は公開情報（Webに公開された記事・プレスリリース）に限定する。SNSの非公開投稿やクローズドな情報は対象外 |
| **透明性** | エージェントが行った全ての変更には `source_agent` と `reasoning` が記録され、なぜその変更が行われたかを追跡可能にする |
| **外部API連携の認証要件** | パブリックHP等へのデータ連携においては、システム間の安全なアクセス制御のため「JWTベースのアクセストークン認証」を必須とする |
| **SNS連携の保護** | SNS投稿ハブ等と連携し情報を発信する際は、OAuthトークンの厳格な保存・管理方法を設計に組み込み、アカウント乗っ取りを防止する |

---

## 9. 将来の拡張

- **Hermes Orchestrator の高度化** — 複数サブエージェント間の依存関係管理・実行順序の最適化を行う統括レイヤーを追加する
- **述語（predicate）の正規化・オントロジー化** — MVPでは自由記述のままとしているTripleの述語を、共通語彙に統合し表記揺れをなくす
- **クローズドコミュニティ・モニタリング機能との統合** — 企画書7〜8章で定義した心理的安全性ガードレール（匿名化・抽象化、DM対象外、ポジティブ用途への限定等）を、単一のHermesとして本書のグラフメンテナンス機能とも一貫させる
- **Agent 4: レポート生成エージェント** — 週次でネットワークの変化サマリーを自動生成
- **Agent 5: マッチングエージェント** — potential リンクの中から特に相乗効果が高そうなペアをオーナーに推薦
- **NotebookLM連携** — Enterprise版が利用可能になった場合、情報収集エージェントのソースとして統合
- **パブリック出力層（公式HP）へのシームレスなデータ連携** — Hermesが処理したエンティティ情報を、ヘッドレスCMS（microCMS等）のAPI経由でパブリックHP（ProjectsやInsights）へ流し込む
- **データ駆動型可視化（Future Constellation）への拡張** — 蓄積した「人物・プロジェクト・組織の相関ネットワーク」を、Next.jsやネットワーク描画ライブラリを用いたHP上のUIとして表現し、将来的なAR展開や空間コンピューティングへの布石とする
