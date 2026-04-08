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
  GripVertical,
  Plus,
  ArrowDown,
  ArrowUp
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

// --- Assets ---
const categories = [
  { id: 'aisatsu', name: 'あいさつ' },
  { id: 'game', name: 'ゲーム' },
  { id: 'hagemashi', name: 'はげまし' }
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
  
  const [selectedList, setSelectedList] = useState<Sticker[]>([]);
  const [unselectedList, setUnselectedList] = useState<Sticker[]>(initialStickersData);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Load Initial State
  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await supabase
          .from('sticker_selections')
          .select('*')
          .eq('nickname', 'Gakusei')
          .single();

        if (data && data.reorder_list && Array.isArray(data.reorder_list)) {
          setSelectedList(data.reorder_list);
          const usedIds = data.reorder_list.map((s: Sticker) => s.id);
          setUnselectedList(initialStickersData.filter(s => !usedIds.includes(s.id)));
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
        nickname: 'Gakusei',
        reorder_list: selectedList,
        selected_ids: selectedList.map(s => s.id),
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
  }, [selectedList, isConfirmed, isInitialized]);

  // Actions
  const addToSelected = (sticker: Sticker) => {
    if (isConfirmed) return;
    setUnselectedList(prev => prev.filter(s => s.id !== sticker.id));
    setSelectedList(prev => [...prev, sticker]);
  };

  const removeFromSelected = (sticker: Sticker) => {
    if (isConfirmed) return;
    setSelectedList(prev => prev.filter(s => s.id !== sticker.id));
    setUnselectedList(prev => [sticker, ...prev]);
  };

  const handleReset = () => {
    if (confirm("最初からやり直しますか？")) {
      setSelectedList([]);
      setUnselectedList(initialStickersData);
      setIsConfirmed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNotifyTeacher = async () => {
    const messageContent = prompt("先生へのメッセージを入力：", `${selectedList.length}個選びました！`);
    if (messageContent === null) return;
    setIsSending(true);
    try {
      const stickerNames = selectedList.map((s, i) => `${i + 1}. ${s.url.split('/').slice(-2).join('/')}`).join('\n');
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: 'Gakusei', message: messageContent, stickerList: stickerNames })
      });
      if (response.ok) {
        alert("先生へ送信しました！");
        setIsConfirmed(true);
        await syncToSupabase(true);
      } else {
        alert("送信に失敗しました。メールアプリを開きます。");
        window.location.href = `mailto:miidacnt@gmail.com?subject=報告&body=${encodeURIComponent(stickerNames)}`;
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isInitialized) return <div className="min-h-screen bg-[#00B900] flex items-center justify-center"><Loader2 className="text-white animate-spin" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-40">
      {/* Header */}
      <div className="sticky top-0 z-[80] bg-[#00B900] text-white shadow-lg p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black opacity-70">
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-white animate-pulse" : "bg-white/40")} />
              {isSyncing ? "自動保存中..." : "保存済み"}
            </div>
            <div>STAMP ARRANGER</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black opacity-60">選んだ数</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{selectedList.length}</span>
                <span className="text-lg opacity-40">枚</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setStage('slideshow')}
                disabled={selectedList.length === 0}
                className="bg-white text-[#00B900] px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={18} /> 確認する
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-12">
        {/* --- Area 1: Selected & Reorderable --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={20} />
              決定したスタンプ（並べ替え可能）
            </h2>
            <button onClick={handleReset} className="text-xs font-bold text-slate-400 underline">リセット</button>
          </div>

          {selectedList.length === 0 ? (
            <div className="border-4 border-dashed border-slate-200 rounded-[32px] p-12 text-center text-slate-400 font-bold">
              下のリストから<br/>使いたいスタンプをタップしてね！
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={selectedList} 
              onReorder={(newOrder) => !isConfirmed && setSelectedList(newOrder)}
              className="space-y-3"
            >
              {selectedList.map((sticker, idx) => (
                <Reorder.Item 
                  key={sticker.id} 
                  value={sticker}
                  dragListener={!isConfirmed}
                  className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border-2 border-transparent active:border-[#00B900] active:scale-[1.02] transition-all touch-none list-none"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 h-32 flex items-center justify-center bg-slate-50 rounded-2xl">
                    <img src={sticker.url} alt="" className="h-full object-contain p-2 pointer-events-none" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="p-2 cursor-grab active:cursor-grabbing text-slate-300">
                      <GripVertical size={24} />
                    </div>
                    <button 
                      onClick={() => removeFromSelected(sticker)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </section>

        {/* --- Area 2: Unselected Pool --- */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 px-2 flex items-center gap-2">
            <Plus className="text-[#00B900]" size={20} />
            スタンプをえらぶ（タップして追加）
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-white p-4 rounded-[32px] shadow-inner border-2 border-slate-100">
            {unselectedList.map(sticker => (
              <motion.button
                key={sticker.id}
                layout
                whileTap={{ scale: 0.9 }}
                onClick={() => addToSelected(sticker)}
                className="aspect-square bg-slate-50 rounded-xl p-1.5 border-2 border-transparent hover:border-[#00B900]/30 transition-all flex items-center justify-center relative group"
              >
                <img src={sticker.url} alt="" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-[#00B900]/0 group-hover:bg-[#00B900]/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                  <Plus className="text-[#00B900]" size={20} />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      {/* --- Slideshow Page --- */}
      <AnimatePresence>
        {stage === 'slideshow' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="p-6 flex items-center justify-between border-b pt-14">
              <button onClick={() => setStage('main')} className="p-2 bg-slate-100 rounded-2xl"><ChevronLeft size={28} /></button>
              <div className="text-center">
                <div className="font-black text-[#00B900]">最終チェック</div>
                <div className="text-[10px] font-bold text-slate-400">{slideshowIndex + 1} / {selectedList.length}</div>
              </div>
              <button onClick={handleNotifyTeacher} className="px-6 py-2 bg-[#00B900] text-white rounded-2xl font-black text-sm shadow-lg flex items-center gap-2">
                <Send size={18} /> 報告
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
              <AnimatePresence mode="wait">
                <motion.div key={selectedList[slideshowIndex]?.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="w-full max-w-sm aspect-square bg-slate-50 rounded-[40px] p-12 relative shadow-inner">
                  <img src={selectedList[slideshowIndex]?.url} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
                  <div className="absolute -bottom-4 -right-4 bg-[#00B900] text-white w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white rotate-12">
                    {slideshowIndex + 1}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-8 flex justify-between top-1/2 -translate-y-1/2 pointer-events-none">
                <button onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))} className="pointer-events-auto p-4 bg-white shadow-2xl rounded-full text-[#00B900]"><ChevronLeft size={40} /></button>
                <button onClick={() => setSlideshowIndex(prev => Math.min(selectedList.length - 1, prev + 1))} className="pointer-events-auto p-4 bg-white shadow-2xl rounded-full text-[#00B900]"><ChevronRight size={40} /></button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
              {selectedList.map((s, i) => (
                <button key={s.id} onClick={() => setSlideshowIndex(i)} className={cn("w-14 h-14 rounded-xl border-2 shrink-0 bg-white", slideshowIndex === i ? "border-[#00B900]" : "border-transparent opacity-40")}>
                  <img src={s.url} alt="" className="w-full h-full object-contain p-1" />
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
