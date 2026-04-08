# プロジェクト仕様書 (SPEC.md)

## 1. システム構成
- **URL**: [https://doresuru.vercel.app](https://doresuru.vercel.app)
- **Database**: Supabase (PostgreSQL)
- **Repository**: GitHub (iidaatcnt/doresuru)

## 2. データベース接続情報 (重要)
- **Supabase Project URL**: `https://ledhszomptewlvrtsfrt.supabase.co`
- **Anon Public Key**: `sb_publishable_ixBcXxg3BOkz9urE04FEuQ_vcaEi2kY`
- **Database Password**: `ft7JQXqK4S7z` (管理者用)

## 3. テーブル定義 (`sticker_selections`)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| id | uuid | 主キー |
| nickname | text | ユーザー識別名 (現状: `Gakusei`) |
| selected_ids | jsonb | 選ばれた(ボツでない)スタンプIDの配列 |
| reorder_list | jsonb | 並び替え後のスタンプオブジェクトの配列 |
| is_confirmed | boolean | 確定フラグ |
| message | text | 先生へのメッセージ |
| updated_at | timestamp | 最終更新日時 |

## 4. UI/UX ルール
- **カラー**: LINEグリーン (`#00B900`) を基調。
- **グリッド**: スマホで押しやすい4列配置。
- **選択ロジック**: 「引き算方式」。全選択からスタートし、ボツをタップして40枚にする。
- **ナビゲーション**: 画面上部の緑色バーにアクションをまとめ、常に視認可能にする。
