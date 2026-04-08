"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { supabase } from '../lib/supabase';
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
  Send,
  Maximize2,
  Minimize2,
  LayoutGrid
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
const DEFAULT_USER = "Gakusei"; 

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
  const [isSending, setIsSending] = useState(false);
  
  const [stickers] = useState<Sticker[]>(initialStickers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderList, setReorderList] = useState<Sticker[]>([]);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // --- Zoom logic ---
  const [gridCols, setGridCols] = useState(4); // 4 to 10
  
  // Load Initial State
  useEffect(() => {
    const initApp = async () => {
      try {
        const { data, error } = await supabase
          .from('sticker_selections')
          .select('*')
          .eq('nickname', DEFAULT_USER)
          .single();

        if (data) {
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

  // Sync to Supabase
  const syncToSupabase = async (forceConfirmed?: boolean) => {
    if (!isInitialized || isSyncing) return;
    setIsSyncing(true);

    try {
      await supabase.from('sticker_selections').upsert({
        nickname: DEFAULT_USER,
        selected_ids: selectedIds,
        reorder_list: reorderList.length > 0 ? reorderList : [],
        is_confirmed: forceConfirmed !== undefined ? forceConfirmed : isConfirmed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'nickname' });
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => syncToSupabase(), 2000);
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
    const messageContent = prompt("先生へのひとことメッセージを入力してください：", "40個選びました！よろしくお願いします。");
    if (messageContent === null) return;

    setIsSending(true);
    try {
      const stickerNames = reorderList.map((s, i) => `${i + 1}. ${s.url.split('/').slice(-2).join('/')}`).join('\n');
      
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: DEFAULT_USER,
          message: messageContent,
          stickerList: stickerNames
        })
      });

      if (response.ok) {
        alert("先生へ送信しました！");
        setIsConfirmed(true);
        await syncToSupabase(true);
      } else {
        alert("送信に失敗しました。メールアプリを開きます。");
        // フォールバック
        const subject = encodeURIComponent(`【スタンプ確定】報告：40個選びました`);
        const body = encodeURIComponent(`先生へ\n\n${messageContent}\n\n■選んだスタンプリスト：\n${stickerNames}`);
        window.location.href = `mailto:miidacnt@gmail.com?subject=${subject}&body=${body}`;
        setIsConfirmed(true);
        await syncToSupabase(true);
      }
    } catch (e) {
      console.error("Send error", e);
    } finally {
      setIsSending(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#00B900] flex items-center justify-center">
        <Loader2 className="text-white animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* --- Top Bar Navigation --- */}
      <div className="sticky top-0 left-0 w-full bg-[#00B900] z-[80] shadow-xl text-white">
        <div className="max-w-xl mx-auto px-6 py-6 flex flex-col items-center gap-4">
          <div className="flex w-full justify-between items-center text-[10px] font-black opacity-70 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-white animate-pulse" : "bg-white/40")} />
              {isSyncing ? "同期中..." : "保存済み"}
            </div>
            <div>LINEスタンプ ならびかえ</div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black opacity-60 uppercase mb-1">
                {stage === 'selection' ? 'えらんだ数' : 'ならびかえ中'}
              </span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-6xl font-black tabular-nums">{selectedIds.length}</span>
                <span className="text-xl font-bold opacity-40">/ {REQUIRED_SELECTION}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {stage === 'selection' && selectedIds.length === REQUIRED_SELECTION && !isConfirmed && (
                <button 
                  onClick={() => setStage('reordering')}
                  className="bg-white text-[#00B900] px-6 py-3 rounded-full font-black text-sm shadow-[0_4px_0_#eeeeee] active:shadow-none active:translate-y-[4px] flex items-center gap-2 transition-all animate-bounce"
                >
                  つぎへ <ArrowRight size={18} />
                </button>
              )}
              {stage === 'reordering' && !isConfirmed && (
                <button 
                  onClick={() => setStage('slideshow')}
                  className="bg-white text-[#00B900] px-6 py-3 rounded-full font-black text-sm shadow-[0_4px_0_#eeeeee] active:shadow-none active:translate-y-[4px] flex items-center gap-2 transition-all"
                >
                  確認する <Play size={18} />
                </button>
              )}
              {isConfirmed && (
                <div className="bg-white/20 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2">
                  <CheckCircle2 size={14} /> 報告済み
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full justify-between mt-2">
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full">
              <Minimize2 size={14} className="opacity-60" />
              <input 
                type="range" 
                min="3" 
                max="12" 
                value={gridCols}
                onChange={(e) => setGridCols(parseInt(e.target.value))}
                className="w-20 accent-white h-1 rounded-lg appearance-none cursor-pointer"
              />
              <Maximize2 size={14} className="opacity-60" />
            </div>

            {!isConfirmed && selectedIds.length > REQUIRED_SELECTION && (
              <div className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg animate-pulse border-2 border-white">
                あと {selectedIds.length - REQUIRED_SELECTION} 個をボツに！
              </div>
            )}

            <button onClick={handleReset} className="text-[10px] font-black opacity-60 underline flex items-center gap-1 active:opacity-100">
              <RotateCcw size={12} /> リセット
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Grid --- */}
      <div className="max-w-6xl mx-auto p-4 pt-10">
        <AnimatePresence mode="wait">
          {stage === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "grid gap-2",
                gridCols === 3 && "grid-cols-3",
                gridCols === 4 && "grid-cols-4",
                gridCols === 5 && "grid-cols-5",
                gridCols === 6 && "grid-cols-6",
                gridCols === 7 && "grid-cols-7",
                gridCols === 8 && "grid-cols-8",
                gridCols === 9 && "grid-cols-9",
                gridCols === 10 && "grid-cols-10",
                gridCols === 11 && "grid-cols-11",
                gridCols === 12 && "grid-cols-12",
              )}
            >
              {stickers.map((sticker) => {
                const isSelected = selectedIds.includes(sticker.id);
                return (
                  <motion.div
                    key={sticker.id}
                    layout
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(sticker.id)}
                    className={cn(
                      "relative aspect-square rounded-2xl p-1 bg-white border-2 cursor-pointer transition-all duration-300",
                      isSelected ? "border-gray-50 shadow-sm" : "border-red-500/20 bg-gray-100 opacity-40 grayscale scale-90",
                    )}
                  >
                    <img src={sticker.url} alt="" className="w-full h-full object-contain p-1" />
                    {!isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <X className="text-red-500 w-1/2 h-1/2 opacity-30" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {stage === 'reordering' && (
            <motion.div 
              key="reordering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8 bg-[#00B900]/5 border-2 border-[#00B900]/20 p-6 rounded-[32px] flex items-center justify-between text-[#00B900]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00B900] text-white rounded-full flex items-center justify-center">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">ならびかえ</h3>
                    <p className="text-xs font-bold opacity-70">スタンプを長押しして動かせるよ！</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStage('selection')}
                  className="bg-white border-2 border-gray-100 px-4 py-2 rounded-full text-xs font-black text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                >
                  えらびなおす
                </button>
              </div>

              <Reorder.Group 
                axis="y" 
                values={reorderList} 
                onReorder={(newOrder) => !isConfirmed && setReorderList(newOrder)}
                className={cn(
                  "grid gap-3",
                  gridCols === 3 && "grid-cols-3",
                  gridCols === 4 && "grid-cols-4",
                  gridCols === 5 && "grid-cols-5",
                  gridCols === 6 && "grid-cols-6",
                  gridCols === 7 && "grid-cols-7",
                  gridCols === 8 && "grid-cols-8",
                  gridCols === 9 && "grid-cols-9",
                  gridCols === 10 && "grid-cols-10",
                  gridCols === 11 && "grid-cols-11",
                  gridCols === 12 && "grid-cols-12",
                )}
              >
                {reorderList.map((sticker, idx) => (
                  <Reorder.Item 
                    key={sticker.id} 
                    value={sticker}
                    drag={!isConfirmed}
                    className="relative aspect-square bg-white rounded-2xl p-2 shadow-sm border-2 border-transparent active:border-[#00B900] active:shadow-xl touch-none"
                  >
                    <img src={sticker.url} alt="" className="w-full h-full object-contain pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00B900] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-white">
                      {idx + 1}
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Slideshow Page --- */}
      <AnimatePresence>
        {stage === 'slideshow' && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-100 pt-14 pb-4">
              <button 
                onClick={() => !isConfirmed && setStage('reordering')} 
                className="w-12 h-12 text-gray-400 flex items-center justify-center transition-all bg-gray-50 rounded-2xl active:scale-90"
              >
                {isConfirmed ? <X size={28} /> : <ChevronLeft size={28} />}
              </button>
              <div className="flex flex-col items-center">
                <div className="text-xl font-black text-[#00B900]">最終チェック</div>
                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full mt-1">
                  {slideshowIndex + 1} / {REQUIRED_SELECTION} 枚目
                </div>
              </div>
              {!isConfirmed ? (
                <button 
                  disabled={isSending}
                  onClick={handleNotifyTeacher}
                  className="px-6 py-3 bg-[#00B900] text-white text-sm font-black rounded-2xl shadow-[0_4px_0_#008a00] active:shadow-none active:translate-y-[4px] flex items-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> 先生へ報告</>}
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#00B900]/5 rounded-full blur-3xl" />
              
              <div className="relative w-full max-w-sm aspect-square bg-white rounded-[40px] shadow-2xl p-8 border border-gray-50 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={reorderList[slideshowIndex]?.id}
                    initial={{ opacity: 0, x: 50, rotate: 5 }}
                    animate={{ opacity: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, x: -50, rotate: -5 }}
                    className="w-full h-full flex flex-col items-center justify-center gap-8"
                  >
                    <img 
                      src={reorderList[slideshowIndex]?.url} 
                      alt="" 
                      className="max-w-full max-h-[85%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)]" 
                    />
                    <div className="absolute -bottom-2 -right-2 bg-[#00B900] text-white w-20 h-20 rounded-full flex items-center justify-center text-5xl font-black shadow-xl border-4 border-white rotate-12">
                      {slideshowIndex + 1}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))} 
                  className={cn(
                    "pointer-events-auto w-16 h-16 bg-white shadow-2xl rounded-full flex items-center justify-center text-[#00B900] active:scale-90 transition-all border border-gray-50",
                    slideshowIndex === 0 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronLeft size={40} />
                </button>
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.min(REQUIRED_SELECTION - 1, prev + 1))} 
                  className={cn(
                    "pointer-events-auto w-16 h-16 bg-white shadow-2xl rounded-full flex items-center justify-center text-[#00B900] active:scale-90 transition-all border border-gray-50",
                    slideshowIndex === REQUIRED_SELECTION - 1 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronRight size={40} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-4 overflow-x-auto scrollbar-hide snap-x">
              {reorderList.map((sticker, i) => (
                <button 
                  key={sticker.id} 
                  onClick={() => setSlideshowIndex(i)} 
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded-2xl border-4 transition-all overflow-hidden bg-white snap-center", 
                    slideshowIndex === i ? "border-[#00B900] scale-110 shadow-lg" : "border-transparent opacity-40 grayscale"
                  )}
                >
                  <img src={sticker.url} alt="" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
