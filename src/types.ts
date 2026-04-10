// =============================
// Sticker (スタンプ) Types
// =============================

/** Firebase Storage に保存されたスタンプのメタデータ（Firestoreドキュメント） */
export interface StickerDoc {
  id: string;            // Firestoreドキュメントのid
  category: string;      // カテゴリID (aisatsu / game / hagemashi)
  categoryName: string;  // カテゴリ表示名
  storagePath: string;   // Firebase Storage のパス (例: stickers/aisatsu/01.png)
  downloadUrl: string;   // Firebase Storage のダウンロードURL
  order: number;         // 表示順
  filename?: string;
  createdAt: Date;
}

/** UI内で使用するスタンプオブジェクト */
export interface Sticker {
  id: string;
  url: string;           // downloadUrl
  category: string;
  categoryName: string;
  order: number;
  storagePath: string;
  filename?: string;
}

// =============================
// Selection (生徒の選択) Types
// =============================

/** Firestoreに保存される生徒の選択状態 */
export interface SelectionDoc {
  nickname: string;
  selectedIds: string[];
  reorderList: Sticker[];
  isConfirmed: boolean;
  message: string;
  updatedAt: Date;
}

// =============================
// Categories
// =============================

export const CATEGORIES: { id: string; name: string }[] = [
  { id: 'aisatsu', name: 'あいさつ' },
  { id: 'game', name: 'ゲーム' },
  { id: 'hagemashi', name: 'はげまし' },
];

export type Stage = 'main' | 'slideshow';

export type AppView = 'student' | 'admin';
