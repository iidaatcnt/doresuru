import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sticker, StickerDoc } from '@/types';

/**
 * Firestoreの`stickers`コレクションからスタンプ一覧を取得するフック。
 * 各スタンプはFirebase Storageのダウンロード済みURLを持つ。
 */
export function useStickers() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStickers = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = collection(db, 'stickers');
      const snapshot = await getDocs(q);
      let data: Sticker[] = snapshot.docs.map((doc) => {
        const d = doc.data() as StickerDoc;
        return {
          id: doc.id,
          url: d.downloadUrl,
          category: d.category,
          categoryName: d.categoryName,
          order: d.order,
          storagePath: d.storagePath,
          filename: d.filename,
        };
      });
      data.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        // ファイル名の辞書順（01.png, 02.png, ...）でソート
        const fa = (a.filename ?? '').toLowerCase();
        const fb = (b.filename ?? '').toLowerCase();
        return fa.localeCompare(fb, undefined, { numeric: true, sensitivity: 'base' });
      });
      setStickers(data);
    } catch (err) {
      console.error('Failed to fetch stickers:', err);
      setError('スタンプの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  return { stickers, loading, error, refetch: fetchStickers };
}
