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
  Loader2
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

type Stage = 'login' | 'selection' | 'reordering' | 'slideshow';

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

const ProgressBar = ({ current, total, text, onReset, isConfirmed, nickname, isSyncing }: { current: number; total: number; text: string; onReset?: () => void; isConfirmed?: boolean; nickname?: string; isSyncing?: boolean }) => (
  <div className="fixed top-0 left-0 w-full bg-[#00B900] z-50 px-6 pt-12 pb-8 shadow-2xl border-b-4 border-white/30">
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <div className="flex justify-between items-center text-white/80 mb-2">
        <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">
          <User size={12} />
          {nickname || 'ゲスト'}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black">
          {isSyncing ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              同期中...
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
              保存済み
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-white gap-2">
        <span className="text-sm font-black opacity-90 tracking-widest uppercase">{text}</span>
        <div className="flex items-baseline gap-3">
          <motion.span 
            key={current}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl font-black tabular-nums drop-shadow-lg"
          >
            {current}
          </motion.span>
          <span className="text-3xl font-bold opacity-50">/ {total}</span>
        </div>
        
        {!isConfirmed && current > total && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-yellow-400 text-slate-900 px-6 py-2 rounded-full text-sm font-black animate-bounce shadow-xl flex items-center gap-2 border-2 border-white"
          >
            <X size={16} />
            あと {current - total} 個タップしてボツにしよう！
          </motion.div>
        )}

        {!isConfirmed && current === total && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 bg-white text-[#00B900] px-6 py-2 rounded-full text-sm font-black shadow-xl flex items-center gap-2 border-2 border-[#00B900]"
          >
            <Sparkles size={16} className="text-yellow-400" />
            ちょうど40個！下のボタンでつぎへ進もう！
          </motion.div>
        )}
      </div>
    </div>
  </div>
);

export default function Home() {
  const [stage, setStage] = useState<Stage>('login');
  const [nickname, setNickname] = useState('');
  const [inputName, setInputName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [stickers] = useState<Sticker[]>(initialStickers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderList, setReorderList] = useState<Sticker[]>([]);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Auto-login if nickname is in localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('doresuru_nickname');
    if (savedName) {
      handleLogin(savedName);
    }
  }, []);

  const handleLogin = async (nameToLogin: string) => {
    if (!nameToLogin.trim()) return;
    setIsLoading(true);
    
    try {
      // Firebase Firestoreからデータを取得
      const docRef = doc(db, 'selections', nameToLogin);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedIds(data.selected_ids || []);
        if (data.reorder_list && Array.isArray(data.reorder_list)) {
          setReorderList(data.reorder_list);
        }
        setIsConfirmed(data.is_confirmed || false);
        setStage(data.is_confirmed ? 'slideshow' : 'selection');
      } else {
        // 新規ユーザー
        setSelectedIds(initialStickers.map(s => s.id));
        setStage('selection');
      }

      setNickname(nameToLogin);
      localStorage.setItem('doresuru_nickname', nameToLogin);
    } catch (err) {
      console.error('Login error:', err);
      setNickname(nameToLogin);
      setStage('selection');
      setSelectedIds(initialStickers.map(s => s.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Sync data to Firebase
  const syncToFirebase = async (forceConfirmed = false) => {
    if (!nickname || isLoading) return;
    setIsSyncing(true);

    try {
      const docRef = doc(db, 'selections', nickname);
      await setDoc(docRef, {
        nickname,
        selected_ids: selectedIds,
        reorder_list: reorderList.length > 0 ? reorderList : [],
        is_confirmed: forceConfirmed || isConfirmed,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when state changes
  useEffect(() => {
    if (nickname && stage !== 'login') {
      const timer = setTimeout(() => syncToFirebase(), 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds, reorderList, isConfirmed, nickname, stage]);

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
    const subject = encodeURIComponent(`【スタンプ確定】報告：${nickname}さんが40個選びました`);
    const body = encodeURIComponent(`先生へ\n\nニックネーム: ${nickname}\n\n${message}\n\n■選んだスタンプリスト：\n${filenames}`);
    
    window.location.href = `mailto:miidacnt@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('doresuru_nickname');
    setNickname('');
    setStage('login');
  };

  if (stage === 'login') {
    return (
      <div className="fixed inset-0 bg-[#00B900] flex items-center justify-center p-6 px-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[340px] bg-white rounded-[40px] p-8 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-400" />
          
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 bg-[#f0f9f0] rounded-full flex items-center justify-center text-[#00B900] mt-2">
              <User size={40} />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-800">ログイン</h1>
              <p className="text-slate-500 text-xs font-bold">なまえを入力してね！</p>
            </div>

            <div className="w-full space-y-4">
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                autoFocus
                placeholder="なまえ"
                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#00B900] focus:bg-white outline-none transition-all text-lg font-black text-center text-slate-800 placeholder:text-gray-300 shadow-inner"
              />
              
              <button
                disabled={!inputName.trim() || isLoading}
                onClick={() => handleLogin(inputName)}
                className="w-full py-4 bg-[#00B900] text-white rounded-2xl font-black text-xl shadow-[0_8px_0_#008a00] hover:shadow-[0_4px_0_#008a00] active:shadow-none hover:translate-y-[2px] active:translate-y-[8px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <span>スタート！</span>
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 pt-72 px-4 bg-[#F8F9FA] font-sans selection:bg-[#00B900]/20">
      {stage === 'selection' && (
        <div className="max-w-4xl mx-auto">
          <ProgressBar 
            current={selectedIds.length} 
            total={REQUIRED_SELECTION} 
            text="えらんだ数" 
            onReset={handleReset}
            isConfirmed={isConfirmed}
            nickname={nickname}
            isSyncing={isSyncing}
          />
          
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
            {stickers.map((sticker) => {
              const isSelected = selectedIds.includes(sticker.id);
              
              return (
                <motion.div
                  key={sticker.id}
                  layout
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSelection(sticker.id)}
                  className={cn(
                    "relative aspect-square rounded-xl p-1 bg-white border cursor-pointer transition-all duration-300",
                    isSelected 
                      ? "border-gray-100 shadow-sm" 
                      : "border-red-500/50 bg-gray-100 shadow-inner",
                  )}
                >
                  <div className={cn(
                    "w-full h-full flex items-center justify-center p-1.5 rounded-lg transition-all",
                    !isSelected && "grayscale opacity-30"
                  )}>
                    <img 
                      src={sticker.url} 
                      alt="" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  
                  {sticker.recommended && isSelected && (
                    <div className="absolute -top-1.5 -left-1.5 bg-yellow-400 text-white px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm border border-white z-20">
                      HOT
                    </div>
                  )}
                  
                  {!isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl z-30 pointer-events-none">
                      <X className="text-red-500 w-full h-full p-2 opacity-80" />
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
            onReset={handleReset}
            isConfirmed={isConfirmed}
            nickname={nickname}
            isSyncing={isSyncing}
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
            onReorder={(newOrder) => !isConfirmed && setReorderList(newOrder)}
            className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
          >
            {reorderList.map((sticker, idx) => (
              <Reorder.Item 
                key={sticker.id} 
                value={sticker}
                drag={!isConfirmed}
                className={cn(
                  "relative aspect-square bg-white rounded-xl p-2 shadow-sm border border-gray-50 touch-none",
                  !isConfirmed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                )}
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

      {(stage === 'slideshow' || isConfirmed) && (
        <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 pt-16">
            <button 
              onClick={() => isConfirmed ? (setStage('selection'), window.scrollTo(0,0)) : setStage('reordering')}
              className="w-10 h-10 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center transition-all active:scale-90"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center">
              <div className="text-xl font-black text-[#00B900]">スライドショー</div>
              <div className="text-xs font-bold text-gray-400">
                {nickname} さん | {slideshowIndex + 1} / {REQUIRED_SELECTION}
              </div>
            </div>
            {!isConfirmed ? (
              <button 
                onClick={handleNotifyTeacher}
                className="px-4 py-2 bg-[#00B900] text-white text-xs font-black rounded-lg shadow-md"
              >
                先生に知らせる
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 text-gray-400 text-[10px] font-black rounded-lg"
              >
                ログアウト
              </button>
            )}
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
                    className="w-full h-full flex flex-col items-center justify-center gap-6"
                  >
                    <img 
                      src={reorderList[slideshowIndex].url} 
                      alt="" 
                      className="max-w-full max-h-[80%] object-contain drop-shadow-2xl" 
                    />
                    <div className="text-gray-400 text-sm font-mono bg-gray-50 px-3 py-1 rounded">
                      {reorderList[slideshowIndex].url.split('/').slice(-2).join('/')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-y-0 -left-6 -right-6 flex items-center justify-between pointer-events-none">
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))}
                  className={cn(
                    "pointer-events-auto w-14 h-14 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 transition-all active:scale-90",
                    slideshowIndex === 0 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronLeft size={40} />
                </button>
                <button 
                  onClick={() => setSlideshowIndex(prev => Math.min(REQUIRED_SELECTION - 1, prev + 1))}
                  className={cn(
                    "pointer-events-auto w-14 h-14 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 transition-all active:scale-90",
                    slideshowIndex === REQUIRED_SELECTION - 1 && "opacity-20 pointer-events-none"
                  )}
                >
                  <ChevronRight size={40} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
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
        {!isConfirmed && stage !== 'slideshow' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 flex flex-col gap-3"
          >
            {selectedIds.length === REQUIRED_SELECTION && (
              <button
                onClick={() => setStage('slideshow')}
                className="w-full py-3 bg-white text-[#00B900] border-2 border-[#00B900] rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                スライドショーで確認する
              </button>
            )}
            
            <button
              disabled={selectedIds.length !== REQUIRED_SELECTION}
              onClick={selectedIds.length === REQUIRED_SELECTION ? (stage === 'selection' ? () => setStage('reordering') : handleNotifyTeacher) : undefined}
              className={cn(
                "w-full py-5 rounded-full font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl",
                selectedIds.length !== REQUIRED_SELECTION
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#00B900] text-white hover:bg-[#00A000]"
              )}
            >
              {stage === 'selection' ? (
                <>
                  <span>つぎへ（順番をきめる）</span>
                  <ArrowRight size={24} />
                </>
              ) : (
                <>
                  <span>先生に知らせる</span>
                  <Sparkles size={24} />
                </>
              )}
            </button>
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
