"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Trophy,
  X,
  RotateCcw,
  User,
  CloudUpload,
  Loader2,
  Play,
  Send
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Sticker {
  id: string;
  url: string;
  recommended: boolean;
  name: string;
  category: string;
}

type Stage = 'selection' | 'reordering' | 'slideshow';

// --- Constants ---
const REQUIRED_SELECTION = 40;
const DEFAULT_USER = "Gakusei"; // ログインなしのデフォルト名

const categories = [
  { id: 'aisatsu', name: 'あいさつ', color: 'bg-blue-500' },
  { id: 'game', name: 'ゲーム', color: 'bg-purple-500' },
  { id: 'hagemashi', name: 'はげまし', color: 'bg-green-500' }
];

const stickerPaths: string[] = [];
categories.forEach(cat => {
  for (let i = 1; i <= 16; i++) {
    const num = i.toString().padStart(2, '0');
    stickerPaths.push(`/stickers/${cat.id}/${num.toString()}.png`);
  }
});

const initialStickers: Sticker[] = stickerPaths.map((path, i) => {
  const categoryId = path.split('/')[2];
  const category = categories.find(c => c.id === categoryId)?.name || '';
  return {
    id: `sticker-${i}`,
    url: path,
    recommended: i % 6 === 0,
    name: `ステッカー ${i + 1}`,
    category
  };
});

export default function Home() {
  const [stage, setStage] = useState<Stage>('selection');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [stickers] = useState<Sticker[]>(initialStickers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderList, setReorderList] = useState<Sticker[]>([]);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Load Initial State
  useEffect(() => {
    const initApp = async () => {
      try {
        const docRef = doc(db, 'selections', DEFAULT_USER);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSelectedIds(data.selected_ids || []);
          if (data.reorder_list && Array.isArray(data.reorder_list)) {
            setReorderList(data.reorder_list);
          }
          setIsConfirmed(data.is_confirmed || false);
          if (data.is_confirmed) setStage('slideshow');
        } else {
          setSelectedIds(initialStickers.map(s => s.id));
        }
      } catch (e) {
        console.error("Init error", e);
        setSelectedIds(initialStickers.map(s => s.id));
      } finally {
        setIsInitialized(true);
      }
    };
    initApp();
  }, []);

  // Sync to Firebase
  const syncToFirebase = async (forceConfirmed?: boolean) => {
    if (!isInitialized || isSyncing) return;
    setIsSyncing(true);

    try {
      const docRef = doc(db, 'selections', DEFAULT_USER);
      await setDoc(docRef, {
        nickname: DEFAULT_USER,
        selected_ids: selectedIds,
        reorder_list: reorderList.length > 0 ? reorderList : [],
        is_confirmed: forceConfirmed !== undefined ? forceConfirmed : isConfirmed,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => syncToFirebase(), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedIds, reorderList, isConfirmed, isInitialized]);

  useEffect(() => {
    if (stage === 'reordering' || stage === 'slideshow') {
      const selected = stickers.filter(s => selectedIds.includes(s.id));
      if (reorderList.length !== REQUIRED_SELECTION) {
        setReorderList(selected);
      }
    }
  }, [stage, stickers, selectedIds, reorderList.length]);

  const toggleSelection = (id: string) => {
    if (isConfirmed) return;
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= stickers.length) return prev;
      return [...prev, id];
    });
  };

  const handleReset = () => {
    if (confirm("最初からやり直しますか？")) {
      setSelectedIds(initialStickers.map(s => s.id));
      setStage('selection');
      setIsConfirmed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNotifyTeacher = async () => {
    const message = prompt("先生へのひとことメッセージを入力してください：", "40個選びました！よろしくお願いします。");
    if (message === null) return;

    setIsConfirmed(true);
    await syncToFirebase(true);

    const filenames = reorderList.map((s, i) => `${i + 1}. ${s.url.split('/').slice(-2).join('/')}`).join('\n');
    const subject = encodeURIComponent(`【スタンプ確定】報告：40個選びました`);
    const body = encodeURIComponent(`先生へ\n\n${message}\n\n■選んだスタンプリスト：\n${filenames}`);
    
    window.location.href = `mailto:miidacnt@gmail.com?subject=${subject}&body=${body}`;
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#00B900] flex items-center justify-center">
        <Loader2 className="text-white animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* --- Elegant Top Bar --- */}
      <div className="sticky top-0 left-0 w-full bg-[#00B900] z-[80] shadow-xl text-white">
        <div className="max-w-xl mx-auto px-6 py-6 flex flex-col items-center gap-4">
          <div className="flex w-full justify-between items-center text-[10px] font-black opacity-70 uppercase tracking-tighter">
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-white animate-pulse" : "bg-white/40")} />
              {isSyncing ? "同期中..." : "保存済み"}
            </div>
            <div>LINEスタンプ ならびかえ</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black opacity-60 uppercase mb-1">
                {stage === 'selection' ? 'えらんだ数' : 'ならびかえ'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tabular-nums">{selectedIds.length}</span>
                <span className="text-xl font-bold opacity-40">/ {REQUIRED_SELECTION}</span>
              </div>
            </div>

            {/* Action Buttons in Top Bar */}
            <div className="flex flex-col gap-2">
              {stage === 'selection' && selectedIds.length === REQUIRED_SELECTION && !isConfirmed && (
                <button 
                  onClick={() => setStage('reordering')}
                  className="bg-white text-[#00B900] px-6 py-2 rounded-full font-black text-sm shadow-lg flex items-center gap-2 animate-bounce"
                >
                  つぎへ <ArrowRight size={16} />
                </button>
              )}
              {stage === 'reordering' && !isConfirmed && (
                <button 
                  onClick={() => setStage('slideshow')}
                  className="bg-white text-[#00B900] px-6 py-2 rounded-full font-black text-sm shadow-lg flex items-center gap-2 animate-pulse"
                >
                  確認する <Play size={16} />
                </button>
              )}
              {isConfirmed && (
                <div className="bg-white/20 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2">
                  <CheckCircle2 size={14} /> 報告済み
                </div>
              )}
            </div>
          </div>

          {!isConfirmed && selectedIds.length > REQUIRED_SELECTION && (
            <div className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
              あと {selectedIds.length - REQUIRED_SELECTION} 個をボツにしよう！
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleReset} className="text-[10px] font-black opacity-60 underline flex items-center gap-1">
              <RotateCcw size={10} /> 最初からやりなおす
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-4xl mx-auto p-4 pt-8">
        {stage === 'selection' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pb-40">
            {stickers.map((sticker) => {
              const isSelected = selectedIds.includes(sticker.id);
              return (
                <motion.div
                  key={sticker.id}
                  layout
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSelection(sticker.id)}
                  className={cn(
                    "relative aspect-square rounded-xl p-1 bg-white border cursor-pointer transition-all duration-200",
                    isSelected ? "border-gray-100 shadow-sm" : "border-red-500/30 bg-gray-100 opacity-40grayscale",
                  )}
                >
                  <img src={sticker.url} alt="" className="w-full h-full object-contain p-1" />
                  {!isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <X className="text-red-500 w-1/2 h-1/2 opacity-50" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {stage === 'reordering' && (
          <div className="pb-40">
            <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <Sparkles className="text-[#00B900]" size={20} />
              <p className="text-sm font-bold text-gray-500">ドラッグして順番をきめてね！</p>
            </div>
            <Reorder.Group 
              axis="y" 
              values={reorderList} 
              onReorder={(newOrder) => !isConfirmed && setReorderList(newOrder)}
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
            >
              {reorderList.map((sticker, idx) => (
                <Reorder.Item 
                  key={sticker.id} 
                  value={sticker}
                  drag={!isConfirmed}
                  className="relative aspect-square bg-white rounded-xl p-2 shadow-sm border border-gray-50 touch-none"
                >
                  <img src={sticker.url} alt="" className="w-full h-full object-contain pointer-events-none" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00B900] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md">
                    {idx + 1}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      {/* --- Slideshow Overly (Full Screen) --- */}
      {stage === 'slideshow' && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 pt-12">
            <button onClick={() => !isConfirmed && setStage('reordering')} className="w-10 h-10 text-gray-400 flex items-center justify-center transition-all bg-gray-50 rounded-full">
              {isConfirmed ? <X size={24} /> : <ChevronLeft size={24} />}
            </button>
            <div className="flex flex-col items-center">
              <div className="text-xl font-black text-[#00B900]">最終チェック</div>
              <div className="text-[10px] font-bold text-gray-400">
                {slideshowIndex + 1} / {REQUIRED_SELECTION} 枚目
              </div>
            </div>
            {!isConfirmed ? (
              <button 
                onClick={handleNotifyTeacher}
                className="px-6 py-2 bg-[#00B900] text-white text-sm font-black rounded-full shadow-lg flex items-center gap-2"
              >
                先生へ報告 <Send size={16} />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="relative w-full max-w-sm aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reorderList[slideshowIndex]?.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="w-full h-full flex flex-col items-center justify-center gap-8"
                >
                  <img src={reorderList[slideshowIndex]?.url} alt="" className="max-w-full max-h-[85%] object-contain drop-shadow-2xl" />
                  <div className="bg-[#00B900]/10 text-[#00B900] px-4 py-2 rounded-xl text-4xl font-black">
                    {slideshowIndex + 1}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-y-0 -left-6 -right-6 flex items-center justify-between pointer-events-none">
                <button onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))} className="pointer-events-auto w-14 h-14 bg-white/90 shadow-2xl rounded-full flex items-center justify-center text-gray-400">
                  <ChevronLeft size={32} />
                </button>
                <button onClick={() => setSlideshowIndex(prev => Math.min(REQUIRED_SELECTION - 1, prev + 1))} className="pointer-events-auto w-14 h-14 bg-white/90 shadow-2xl rounded-full flex items-center justify-center text-gray-400">
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
            {reorderList.map((sticker, i) => (
              <button key={sticker.id} onClick={() => setSlideshowIndex(i)} className={cn("flex-shrink-0 w-12 h-12 rounded-lg border-2 transition-all overflow-hidden bg-white", slideshowIndex === i ? "border-[#00B900] scale-110" : "border-transparent opacity-40")}>
                <img src={sticker.url} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
