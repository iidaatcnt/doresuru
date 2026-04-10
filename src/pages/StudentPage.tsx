import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useStickers } from '@/hooks/useStickers';
import { useSelection } from '@/hooks/useSelection';
import { Header } from '@/components/Header';
import { SelectedList } from '@/components/SelectedList';
import { StickerGrid } from '@/components/StickerGrid';
import { Slideshow } from '@/components/Slideshow';
import { AdminPanel } from '@/components/AdminPanel';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'sensei2024';

export function StudentPage() {
  const { stickers, loading: stickersLoading, error: stickersError } = useStickers();
  const {
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
  } = useSelection(stickers);

  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleAdminClick = () => {
    const pw = prompt('管理者パスワードを入力してください：');
    if (pw === ADMIN_PASSWORD) {
      setShowAdmin(true);
    } else if (pw !== null) {
      alert('パスワードが違います');
    }
  };

  const handleConfirm = async (message: string) => {
    setIsSending(true);
    try {
      // Firestoreに確定フラグを保存
      await confirm();

      // クリップボードにコピー
      const stickerList = selectedList
        .map((s, i) => `${i + 1}. ${s.filename ? s.filename.replace(/\.[^/.]+$/, "") : `${s.categoryName} #${s.order}`}`)
        .join('\n');
      const body = `先生へ\n\nメッセージ: ${message}\n\n■選んだスタンプリスト：\n${stickerList}`;
      
      try {
        await navigator.clipboard.writeText(body);
        alert('スタンプの選択リストをコピーしました！\nLINEやDiscordに貼り付けて先生に送ってください。');
      } catch (err) {
        // フォールバック: textareaを表示して手動コピーを促す簡単なプロンプト
        prompt('以下のテキストをコピーして送信してください：', body);
      }

      setShowSlideshow(false);
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました。もう一度試してください。');
    } finally {
      setIsSending(false);
    }
  };

  if (stickersLoading || !isInitialized) {
    return (
      <div className="loading-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 size={48} className="loading-icon" />
        </motion.div>
        <p className="loading-text">スタンプを読み込み中...</p>
      </div>
    );
  }

  if (stickersError) {
    return (
      <div className="loading-screen">
        <p className="error-text">⚠️ {stickersError}</p>
        <p className="error-hint">Firebase の設定を確認してください。</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        selectedCount={selectedList.length}
        isSyncing={isSyncing}
        isConfirmed={isConfirmed}
        onShowSlideshow={() => setShowSlideshow(true)}
        onAdminClick={handleAdminClick}
      />

      <main className="main-content">
        <SelectedList
          stickers={selectedList}
          isConfirmed={isConfirmed}
          onReorder={setSelectedList}
          onRemove={removeFromSelected}
          onReset={() => handleReset(stickers)}
        />
        <StickerGrid
          stickers={unselectedList}
          onSelect={addToSelected}
          disabled={isConfirmed}
        />
      </main>

      {/* Slideshow */}
      <AnimatePresence>
        {showSlideshow && (
          <Slideshow
            stickers={selectedList}
            onClose={() => setShowSlideshow(false)}
            onConfirm={handleConfirm}
            isSending={isSending}
            isConfirmed={isConfirmed}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
