import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sticker, SelectionDoc } from '@/types';

const NICKNAME = 'Gakusei';
const DOC_PATH = `sticker_selections/${NICKNAME}`;

/**
 * 生徒の選択状態をFirestoreと同期するフック。
 */
export function useSelection(allStickers: Sticker[]) {
  const [selectedList, setSelectedList] = useState<Sticker[]>([]);
  const [unselectedList, setUnselectedList] = useState<Sticker[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初期読み込み
  useEffect(() => {
    const init = async () => {
      if (allStickers.length === 0) {
        setIsInitialized(true);
        return;
      }
      try {
        const docRef = doc(db, DOC_PATH);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as SelectionDoc;
          if (data.reorderList && Array.isArray(data.reorderList)) {
            setSelectedList(data.reorderList);
            const usedIds = new Set(data.reorderList.map((s: Sticker) => s.id));
            setUnselectedList(allStickers.filter((s) => !usedIds.has(s.id)));
            setIsConfirmed(data.isConfirmed || false);
          } else {
            setUnselectedList(allStickers);
          }
        } else {
          setUnselectedList(allStickers);
        }
      } catch (e) {
        console.error('Init error:', e);
        setUnselectedList(allStickers);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [allStickers]);

  // Firestoreに保存
  const syncToFirestore = useCallback(
    async (overrideConfirmed?: boolean) => {
      if (!isInitialized || isSyncing) return;
      setIsSyncing(true);
      try {
        const docRef = doc(db, DOC_PATH);
        await setDoc(docRef, {
          nickname: NICKNAME,
          selectedIds: selectedList.map((s) => s.id),
          reorderList: selectedList,
          isConfirmed: overrideConfirmed !== undefined ? overrideConfirmed : isConfirmed,
          message: '',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [isInitialized, isSyncing, selectedList, isConfirmed]
  );

  // 変更から2秒後に自動保存
  useEffect(() => {
    if (!isInitialized) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncToFirestore(), 2000);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [selectedList, isConfirmed, isInitialized]);

  // Actions
  const addToSelected = useCallback(
    (sticker: Sticker) => {
      if (isConfirmed) return;
      setUnselectedList((prev) => prev.filter((s) => s.id !== sticker.id));
      setSelectedList((prev) => [...prev, sticker]);
    },
    [isConfirmed]
  );

  const removeFromSelected = useCallback(
    (sticker: Sticker) => {
      if (isConfirmed) return;
      setSelectedList((prev) => prev.filter((s) => s.id !== sticker.id));
      setUnselectedList((prev) => {
        const sorted = [...prev, sticker].sort(
          (a, b) => a.order - b.order || a.category.localeCompare(b.category)
        );
        return sorted;
      });
    },
    [isConfirmed]
  );

  const handleReset = useCallback(
    (allStickersRef: Sticker[]) => {
      if (!window.confirm('最初からやり直しますか？')) return;
      setSelectedList([]);
      setUnselectedList(allStickersRef);
      setIsConfirmed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const confirm = useCallback(async () => {
    setIsConfirmed(true);
    await syncToFirestore(true);
  }, [syncToFirestore]);

  return {
    selectedList,
    setSelectedList,
    unselectedList,
    isConfirmed,
    isInitialized,
    isSyncing,
    addToSelected,
    removeFromSelected,
    handleReset,
    confirm,
    syncToFirestore,
  };
}
