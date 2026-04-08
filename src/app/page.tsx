"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Trophy,
  X
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

// --- Assets ---
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

const REQUIRED_SELECTION = 40;

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

// --- Components ---

const ProgressBar = ({ current, total, text }: { current: number; total: number; text: string }) => (
  <div className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-xl z-50 px-4 py-4 shadow-lg border-b border-gray-100">
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-black text-slate-700 font-sans tracking-tight">{text}</span>
        <span className="text-sm font-black text-[#FF6B6B]">
          <span className="text-3xl lining-nums">{current}</span><span className="mx-1 text-slate-300">/</span>{total}
        </span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#FF6B6B] via-orange-400 to-[#FFE66D]"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
      </div>
    </div>
  </div>
);

export default function Home() {
  const [stage, setStage] = useState<Stage>('selection');
  const [stickers] = useState<Sticker[]>(initialStickers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderList, setReorderList] = useState<Sticker[]>([]);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    if (stage === 'reordering') {
      const selected = stickers.filter(s => selectedIds.includes(s.id));
      setReorderList(prev => prev.length === REQUIRED_SELECTION ? prev : selected);
    }
  }, [stage, stickers, selectedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= REQUIRED_SELECTION) return prev;
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (stage === 'selection' && selectedIds.length === REQUIRED_SELECTION) {
      setStage('reordering');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stage === 'reordering') {
      setStage('slideshow');
    }
  };

  return (
    <div className="min-h-screen pb-40 pt-28 px-4 bg-slate-50 font-sans selection:bg-red-500/20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-blue-200 blur-[120px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-10%] w-[50%] aspect-square bg-pink-100 blur-[120px] rounded-full" />
      </div>

      {stage === 'selection' && (
        <div className="max-w-4xl mx-auto">
          <ProgressBar 
            current={selectedIds.length} 
            total={REQUIRED_SELECTION} 
            text="40個のスタンプをえらぼう！" 
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {stickers.map((sticker) => {
              const isSelected = selectedIds.includes(sticker.id);
              const isDisabled = !isSelected && selectedIds.length >= REQUIRED_SELECTION;
              
              return (
                <motion.div
                  key={sticker.id}
                  layout
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleSelection(sticker.id)}
                  className={cn(
                    "relative aspect-square rounded-[32px] p-4 cursor-pointer transition-all duration-500",
                    isSelected 
                      ? "bg-white shadow-[0_24px_48px_-12px_rgba(255,107,107,0.4)] ring-[6px] ring-[#FF6B6B] scale-105 z-10" 
                      : "bg-white/80 backdrop-blur-sm border-2 border-white hover:bg-white hover:shadow-2xl",
                    isDisabled && "opacity-20 grayscale saturate-0 pointer-events-none"
                  )}
                >
                  <div className="w-full h-full flex items-center justify-center p-2 bg-slate-50/50 rounded-2xl relative overflow-hidden group">
                    <img 
                      src={sticker.url} 
                      alt="" 
                      className="max-w-full max-h-full object-contain drop-shadow-lg transform transition-transform group-hover:scale-110 duration-300" 
                    />
                  </div>
                  
                  {sticker.recommended && (
                    <div className="absolute -top-4 -left-3 bg-[#FFE66D] text-slate-900 px-4 py-1.5 rounded-full text-[12px] font-black flex items-center gap-1.5 shadow-xl border-4 border-white transform -rotate-12 z-20">
                      <Star size={14} fill="currentColor" className="text-orange-500" />
                      おすすめ
                    </div>
                  )}
                  
                  <div className="absolute -top-2 -right-2">
                    {isSelected ? (
                      <motion.div 
                        initial={{ scale: 0, rotate: -20 }} 
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-[#FF6B6B] rounded-full p-1.5 shadow-lg border-4 border-white"
                      >
                        <CheckCircle2 className="text-white" size={24} />
                      </motion.div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-4 border-slate-100 bg-white shadow-inner" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {stage === 'reordering' && (
        <div className="max-w-4xl mx-auto">
          <ProgressBar 
            current={REQUIRED_SELECTION} 
            total={REQUIRED_SELECTION} 
            text="ドラッグしてじゅんばんを決めよう" 
          />
          
          <div className="mb-6 bg-white/60 backdrop-blur-md p-6 rounded-3xl border-2 border-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#4ECDC4]/20 rounded-2xl flex items-center justify-center text-[#4ECDC4]">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">ならびかえタイム！</h2>
                <p className="text-slate-500 text-sm font-medium">好きな順番に入れ替えてね</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-slate-400 font-bold bg-slate-100/50 px-4 py-2 rounded-xl">
              <Trophy size={18} />
              <span>{REQUIRED_SELECTION}枚えらんだよ！</span>
            </div>
          </div>

          <Reorder.Group 
            axis="y" 
            values={reorderList} 
            onReorder={setReorderList}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {reorderList.map((sticker, idx) => (
              <Reorder.Item 
                key={sticker.id} 
                value={sticker}
                className="relative aspect-square bg-white rounded-3xl p-4 shadow-md active:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] touch-none cursor-grab active:cursor-grabbing border-2 border-slate-50"
              >
                <img src={sticker.url} alt="" className="w-full h-full object-contain pointer-events-none" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">
                  {idx + 1}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {stage === 'slideshow' && (
        <div className="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B6B]/40 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4ECDC4]/40 blur-[150px] rounded-full" />
          </div>

          <button 
            onClick={() => setStage('reordering')}
            className="absolute top-8 left-8 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all active:scale-90 z-[110]"
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full max-w-xl aspect-square px-8">
            <AnimatePresence mode="wait">
              {reorderList[slideshowIndex] && (
                <motion.div
                  key={reorderList[slideshowIndex].id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="w-full h-full bg-white rounded-[60px] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]" />
                  <img 
                    src={reorderList[slideshowIndex].url} 
                    alt="" 
                    className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.1)]" 
                  />
                  <div className="absolute bottom-6 bg-slate-100/80 backdrop-blur-md rounded-full px-6 py-2 text-sm font-black text-slate-600 tracking-widest uppercase">
                    No.{slideshowIndex + 1}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
              <button 
                onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))}
                className={cn(
                  "pointer-events-auto w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 transition-all active:scale-90",
                  slideshowIndex === 0 && "opacity-10 pointer-events-none"
                )}
              >
                <ChevronLeft size={44} />
              </button>
              <button 
                onClick={() => setSlideshowIndex(prev => Math.min(REQUIRED_SELECTION - 1, prev + 1))}
                className={cn(
                  "pointer-events-auto w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 transition-all active:scale-90",
                  slideshowIndex === REQUIRED_SELECTION - 1 && "opacity-10 pointer-events-none"
                )}
              >
                <ChevronRight size={44} />
              </button>
            </div>
          </div>

          <div className="mt-20 flex gap-4 overflow-x-auto max-w-full px-12 py-6 scrollbar-hide snap-x">
            {reorderList.map((sticker, i) => (
              <motion.button
                key={sticker.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSlideshowIndex(i)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded-2xl border-4 transition-all overflow-hidden bg-white/10 snap-center relative",
                  slideshowIndex === i 
                    ? "border-[#FF6B6B] scale-125 shadow-[0_0_30px_rgba(255,107,107,0.5)] z-10" 
                    : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={sticker.url} alt="" className="w-full h-full object-contain p-2" />
              </motion.button>
            ))}
          </div>
          
          <div className="mt-4 text-white/30 font-black tracking-widest text-lg">
            {slideshowIndex + 1} <span className="text-white/10 mx-2">/</span> {REQUIRED_SELECTION}
          </div>
        </div>
      )}

      <AnimatePresence>
        {stage !== 'slideshow' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6"
          >
            <div className="relative group">
              <div className={cn(
                "absolute -inset-1 rounded-[40px] blur-xl transition duration-500 opacity-75 group-hover:opacity-100 animate-pulse",
                stage === 'selection' && selectedIds.length < REQUIRED_SELECTION
                  ? "hidden"
                  : "bg-gradient-to-r from-[#FF6B6B] to-orange-400"
              )} />
              
              <button
                disabled={stage === 'selection' && selectedIds.length < REQUIRED_SELECTION}
                onClick={handleNext}
                className={cn(
                  "relative w-full py-6 px-8 rounded-[32px] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95",
                  stage === 'selection' && selectedIds.length < REQUIRED_SELECTION
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-slate-300"
                    : "bg-white text-[#FF6B6B] border-b-8 border-[#FF6B6B] hover:border-b-4 hover:translate-y-1"
                )}
              >
                {stage === 'selection' ? (
                  <>
                    <span>{REQUIRED_SELECTION}個えらんだよ！</span>
                    <ArrowRight size={28} className="animate-bounce-x" />
                  </>
                ) : (
                  <>
                    <span>スライドショーで見る</span>
                    <Sparkles size={28} className="text-[#FFE66D] h-animate-sparkle" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x { animation: bounce-x 1s infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .h-animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
