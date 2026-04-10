# プロジェクト仕様書 (SPEC.md)

## 1. システム構成
- **URL**: [https://doresuru-1dbd6.web.app](https://doresuru-1dbd6.web.app)
- **Frontend Framework**: React 18 + Vite
- **Database / Storage**: Firebase (Firestore + Storage)
- **Hosting**: Firebase Hosting (Project ID: `doresuru-1dbd6`)

## 2. コレクション・ドキュメント定義 (Firestore)

### 2.1 `stickers` (スタンプマスタ)
管理画面からアップロードされた画像データ。
| フィールド   | 型        | 説明                                                |
| :----------- | :-------- | :-------------------------------------------------- |
| category     | string    | カテゴリID (`aisatsu`, `game`, `hagemashi`)         |
| categoryName | string    | カテゴリ表示名（「あいさつ」など）                  |
| storagePath  | string    | Storage上でのパス (`stickers/aisatsu/1234.png` など)|
| downloadUrl  | string    | 画像を表示するための公開URL                         |
| filename     | string    | アップロード時のオリジナルファイル名 (`01.png` など)|
| order        | number    | カテゴリ内での表示順                                |
| createdAt    | timestamp | アップロード日時                                    |

### 2.2 `sticker_selections` (生徒の選択データ)
生徒（現在は`Gakusei`の1固定）が選んだ状態を保持する。
| フィールド   | 型        | 説明                                                         |
| :----------- | :-------- | :----------------------------------------------------------- |
| nickname     | string    | ユーザー識別名 (現状: `Gakusei`)                             |
| selectedIds  | array     | 選ばれたスタンプIDの配列                                     |
| reorderList  | array     | 並び替え後のスタンプオブジェクト（完全なオブジェクト配列）   |
| isConfirmed  | boolean   | 確定フラグ。trueの場合、生徒側のUI追加・削除がロックされる   |
| message      | string    | 送信テキスト用のメッセージ（基本は初期テキスト保持のみ）     |
| updatedAt    | timestamp | 最終更新日時                                                 |

## 3. 環境変数 (`.env.local`)
セキュリティ上Gitにはコミットしていません。
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` 等のFirebase設定一式
- `VITE_ADMIN_PASSWORD`: 管理画面に入るためのパスワード（例: `sensei2024`）

## 4. UI/UX ルール
- **ドラッグ＆ドロップ**: Framer Motion の `Reorder` を使用。
- **選択ロジック**: 「足し算方式」。下半分のリストからタップし、上半分のリストに追加。
- **画像ラベル**: `カテゴリ名 + ファイル名（01.png）`を黒背景白文字のバッジ形式で必ず明記。
- **共有**: メール送信（mailto）は廃止し、クリップボードコピー（`navigator.clipboard.writeText`）によるペースト共有のみとする。
