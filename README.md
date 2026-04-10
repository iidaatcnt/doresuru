# LINEスタンプ ならびかえアプリ (doresuru)

生徒が候補のLINEスタンプから好きなものを選んで並べ替え、その結果をLINEやDiscordで先生に報告するためのWebアプリです。

## 概要
- **目的**: 登録されたスタンプから好きなものを選び、順番を決め、ファイル名のリストを生成する。
- **特徴**: スマホでの直感的な操作、Firebaseによるリアルタイム保存、自動再生可能なスライドショー、管理画面での高度な画像管理 (ZIP対応)。
- **URL**: [https://doresuru-1dbd6.web.app](https://doresuru-1dbd6.web.app)

## 主な機能
1. **スタンプ選択**: 下部のリストから使いたいスタンプをタップし、上部の「決定したスタンプ」枠に追加する。
2. **ドラッグ＆ドロップ並べ替え**: 選んだスタンプの順番を自由に入れ替える。
3. **確認とスライドショー**: 選んだスタンプを大きな画面で1枚ずつ確認。親御さんなどに見せやすい「自動再生」機能つき。
4. **先生への報告**: 確定したリスト（カテゴリとファイル名付き）とメッセージをワンタップでクリップボードにコピーし、LINEで送信。
5. **先生管理画面**: 先生だけが開けるパスワード付き画面。ZIPファイル群の一括アップロードや、不要になったスタンプの全件削除などが可能。

## 技術スタック
- **Frontend**: React, Vite, TypeScript
- **Styling**: Vanilla CSS (globals.css), Lucide React (Icons)
- **Animation**: Framer Motion
- **Backend / Database**: Firebase (Firestore)
- **Storage**: Firebase Storage
- **Deployment**: Firebase Hosting

## ライセンス
Private Project
