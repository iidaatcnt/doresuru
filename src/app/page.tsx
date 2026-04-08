"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  X,
  RotateCcw,
  Loader2,
  Play,
  Send,
  Maximize2,
  Minimize2,
  LayoutGrid,
  GripHorizontal
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

type Stage = 'main' | 'slideshow';

// --- Constants ---
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

const initialStickersData: Sticker[] = stickerPaths.map((path, i) => {
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
  const [stage, setStage] = useState<Stage>('main');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [reorderList, setReorderList] = useState<Sticker[]>(initialStickersData);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [gridCols, setGridCols] = useState(4); 
  
  // Load Initial State from Supabase
  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await supabase
          .from('sticker_selections')
          .select('*')
          .eq('nickname', DEFAULT_USER)
          .single();

        if (data) {
          if (data.reorder_list && Array.isArray(data.reorder_list)) {
            setReorderList(data.reorder_list);
          }
          setIsConfirmed(data.is_confirmed || false);
        }
      } catch (e) {
        console.error("Init error", e);
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
        reorder_list: reorderList,
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
  }, [reorderList, isConfirmed, isInitialized]);

  const handleReset = () => {
    if (confirm("順番を最初のリセットしますか？")) {
      setReorderList(initialStickersData);
      setIsConfirmed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNotifyTeacher = async () => {
    const messageContent = prompt("先生へのひとことメッセージ：", "順番を決めました！");
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
        const body = encodeURIComponent(`先生へ\n\n${messageContent}\n\n■選んだリスト：\n${stickerNames}`);
        window.location.href = `mailto:miidacnt@gmail.com?subject=スタンプ確定報告&body=${body}`;
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
      {/* --- Top Bar --- */}
      <div className="sticky top-0 left-0 w-full bg-[#00B900] z-[80] shadow-xl text-white">
        <div className="max-w-xl mx-auto px-6 py-6 flex flex-col items-center gap-4">
          <div className="flex w-full justify-between items-center text-[10px] font-black opacity-70 uppercase tracking-widest leading-none">
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-white animate-pulse" : "bg-white/40")} />
              {isSyncing ? "同期中..." : "保存済み"}
            </div>
            <div>LINEスタンプ ならびかえ</div>
          </div>

          <div className="flex items-center gap-8 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black opacity-60 uppercase mb-1">ならびかえ中</span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-6xl font-black tabular-nums">{reorderList.length}</span>
                <span className="text-xl font-bold opacity-40">枚</span>
              </div>
            </div>

            {!isConfirmed && (
              <button 
                onClick={() => setStage('slideshow')}
                className="bg-white text-[#00B900] px-8 py-3 rounded-full font-black text-sm shadow-[0_4px_0_#eeeeee] active:shadow-none active:translate-y-[4px] flex items-center gap-2 transition-all"
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

          <div className="flex items-center gap-4 w-full justify-between mt-2">
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full">
              <Minimize2 size={12} className="opacity-60" />
              <input 
                type="range" min="3" max="10" value={gridCols}
                onChange={(e) => setGridCols(parseInt(e.target.value))}
                className="w-24 accent-white h-1 cursor-pointer"
              />
              <Maximize2 size={12} className="opacity-60" />
            </div>
            <button onClick={handleReset} className="text-[10px] font-black opacity-60 underline flex items-center gap-1">
              <RotateCcw size={12} /> リセット
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content: Drag & Drop Grid --- */}
      <div className="max-w-6xl mx-auto p-4 pt-10">
        <Reorder.Group 
          axis="y" 
          values={reorderList} 
          onReorder={(newOrder) => !isConfirmed && setReorderList(newOrder)}
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
          )}
        >
          {reorderList.map((sticker, idx) => {
            const isMultipleOf8 = (idx + 1) % 8 === 0;
            return (
              <Reorder.Item 
                key={sticker.id} 
                value={sticker}
                drag={!isConfirmed}
                className={cn(
                  "relative aspect-square bg-white rounded-2xl p-2 shadow-sm border-2 transition-all touch-none",
                  isConfirmed ? "cursor-default" : "cursor-grab active:cursor-grabbing active:border-[#00B900] active:shadow-2xl",
                  isMultipleOf8 ? "border-[#00B900]/40 ring-4 ring-[#00B900]/10" : "border-gray-50"
                )}
              >
                <img src={sticker.url} alt="" className="w-full h-full object-contain pointer-events-none" />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-white",
                  isMultipleOf8 ? "bg-[#00B900]" : "bg-gray-400"
                )}>
                  {idx + 1}
                </div>
                {isMultipleOf8 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#00B900] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    {idx + 1}枚
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
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
              <button onClick={() => setStage('main')} className="w-12 h-12 text-gray-400 flex items-center justify-center bg-gray-50 rounded-2xl active:scale-90">
                <ChevronLeft size={28} />
              </button>
              <div className="flex flex-col items-center">
                <div className="text-xl font-black text-[#00B900]">最終チェック</div>
                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full mt-1">
                  {slideshowIndex + 1} / {reorderList.length} 枚目
                </div>
              </div>
              {!isConfirmed ? (
                <button 
                  disabled={isSending}
                  onClick={handleNotifyTeacher}
                  className="px-6 py-3 bg-[#00B900] text-white text-sm font-black rounded-2xl shadow-[0_4px_0_#008a00] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> 先生へ報告</>}
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00B900]/5 rounded-full blur-3xl" />
              <div className="relative w-full max-w-sm aspect-square bg-white rounded-[40px] shadow-2xl p-8 border border-gray-50 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={reorderList[slideshowIndex]?.id}
                    initial={{ opacity: 0, x: 50, rotate: 3 }}
                    animate={{ opacity: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, x: -50, rotate: -3 }}
                    className="w-full h-full flex flex-col items-center justify-center gap-8"
                  >
                    <img src={reorderList[slideshowIndex]?.url} alt="" className="max-w-full max-h-[85%] object-contain drop-shadow-2xl" />
                    <div className="absolute -bottom-2 -right-2 bg-[#00B900] text-white w-20 h-20 rounded-full flex items-center justify-center text-5xl font-black shadow-xl border-4 border-white rotate-12">
                      {slideshowIndex + 1}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none px-4">
                <button onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))} className={cn("pointer-events-auto w-16 h-16 bg-white shadow-2xl rounded-full flex items-center justify-center text-[#00B900] active:scale-90 transition-all")}>
                  <ChevronLeft size={40} />
                </button>
                <button onClick={() => setSlideshowIndex(prev => Math.min(reorderList.length - 1, prev + 1))} className={cn("pointer-events-auto w-16 h-16 bg-white shadow-2xl rounded-full flex items-center justify-center text-[#00B900] active:scale-90 transition-all")}>
                  <ChevronRight size={40} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-4 overflow-x-auto scrollbar-hide snap-x">
              {reorderList.map((sticker, i) => (
                <button key={sticker.id} onClick={() => setSlideshowIndex(i)} className={cn("flex-shrink-0 w-16 h-16 rounded-2xl border-4 transition-all overflow-hidden bg-white snap-center", slideshowIndex === i ? "border-[#00B900] scale-110 shadow-lg" : "border-transparent opacity-40 grayscale")}>
                  <img src={sticker.url} alt="" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
