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
  <div className="fixed top-0 left-0 w-full bg-[#00B900] z-50 px-4 pt-10 pb-4 shadow-md">
    <div className="max-w-xl mx-auto flex flex-col gap-3">
      <div className="flex justify-between items-center text-white">
        <h1 className="text-xl font-bold tracking-tight">{text}</h1>
        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-black">
          {current} <span className="opacity-60">/</span> {total}
        </div>
      </div>
      <div className="h-1 bg-black/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
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
    <div className="min-h-screen pb-40 pt-32 px-4 bg-[#F8F9FA] font-sans selection:bg-[#00B900]/20">
      {stage === 'selection' && (
        <div className="max-w-4xl mx-auto">
          <ProgressBar 
            current={selectedIds.length} 
            total={REQUIRED_SELECTION} 
            text="スタンプ選択" 
          />
          
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
            {stickers.map((sticker) => {
              const isSelected = selectedIds.includes(sticker.id);
              const isDisabled = !isSelected && selectedIds.length >= REQUIRED_SELECTION;
              
              return (
                <motion.div
                  key={sticker.id}
                  layout
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSelection(sticker.id)}
                  className={cn(
                    "relative aspect-square rounded-xl p-1 bg-white border cursor-pointer transition-all duration-300",
                    isSelected 
                      ? "border-[#00B900] shadow-[0_4px_12px_rgba(0,185,0,0.2)]" 
                      : "border-gray-100 shadow-sm",
                    isDisabled && "opacity-20 grayscale saturate-0 pointer-events-none"
                  )}
                >
                  <div className="w-full h-full flex items-center justify-center p-1.5 bg-gray-50/30 rounded-lg">
                    <img 
                      src={sticker.url} 
                      alt="" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  
                  {sticker.recommended && (
                    <div className="absolute -top-1.5 -left-1.5 bg-yellow-400 text-white px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm border border-white z-20 uppercase tracking-tighter">
                      HOT
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-[#00B900] rounded-full p-1 shadow-md border-2 border-white z-10">
                      <CheckCircle2 className="text-white" size={12} />
                    </div>
                  )}
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
            text="並べ替え" 
          />
          
          <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between font-sans">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#00B900]" size={20} />
              <p className="text-sm font-bold text-gray-500">ドラッグして順番を変更できます</p>
            </div>
          </div>

          <Reorder.Group 
            axis="y" 
            values={reorderList} 
            onReorder={setReorderList}
            className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
          >
            {reorderList.map((sticker, idx) => (
              <Reorder.Item 
                key={sticker.id} 
                value={sticker}
                className="relative aspect-square bg-white rounded-xl p-2 shadow-sm border border-gray-50 touch-none cursor-grab active:cursor-grabbing"
              >
                <img src={sticker.url} alt="" className="w-full h-full object-contain pointer-events-none" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00B900] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md border border-white">
                  {idx + 1}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {stage === 'slideshow' && (
        <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 mt-8">
            <button 
              onClick={() => setStage('reordering')}
              className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center transition-all active:scale-90"
            >
              <X size={24} />
            </button>
            <div className="text-sm font-bold text-gray-400">
              {slideshowIndex + 1} / {REQUIRED_SELECTION}
            </div>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="relative w-full max-w-sm aspect-square">
              <AnimatePresence mode="wait">
                {reorderList[slideshowIndex] && (
                  <motion.div
                    key={reorderList[slideshowIndex].id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <img 
                      src={reorderList[slideshowIndex].url} 
                      alt="" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))}
                  className={cn(
                    "pointer-events-auto w-12 h-12 rounded-full bg-white/80 shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 transition-all active:scale-90",
                    slideshowIndex === 0 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.min(REQUIRED_SELECTION - 1, prev + 1))}
                  className={cn(
                    "pointer-events-auto w-12 h-12 rounded-full bg-white/80 shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 transition-all active:scale-90",
                    slideshowIndex === REQUIRED_SELECTION - 1 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {reorderList.map((sticker, i) => (
                <button
                  key={sticker.id}
                  onClick={() => setSlideshowIndex(i)}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-lg border-2 transition-all overflow-hidden bg-white snap-center",
                    slideshowIndex === i 
                      ? "border-[#00B900] scale-110 shadow-sm" 
                      : "border-transparent opacity-40"
                  )}
                >
                  <img src={sticker.url} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {stage !== 'slideshow' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <button
              disabled={stage === 'selection' && selectedIds.length < REQUIRED_SELECTION}
              onClick={handleNext}
              className={cn(
                "w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg",
                stage === 'selection' && selectedIds.length < REQUIRED_SELECTION
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#00B900] text-white hover:bg-[#00A000]"
              )}
            >
              {stage === 'selection' ? (
                <>
                  <span>選択を完了する</span>
                  <ArrowRight size={20} />
                </>
              ) : (
                <>
                  <span>大きく表示する</span>
                  <Sparkles size={20} />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
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
