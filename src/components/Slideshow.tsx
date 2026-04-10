import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react';
import type { Sticker } from '@/types';

interface SlideshowProps {
  stickers: Sticker[];
  onClose: () => void;
  onConfirm: (message: string) => Promise<void>;
  isSending: boolean;
  isConfirmed: boolean;
}

export function Slideshow({
  stickers,
  onClose,
  onConfirm,
  isSending,
  isConfirmed,
}: SlideshowProps) {
  const stickerList = stickers
    .map((s, i) => `${i + 1}. ${s.categoryName} ${s.filename ? s.filename : `#${s.order}`}`)
    .join('\n');
    
  const defaultText = `先生へ\n\nよろしくお願いします！\n\n■選んだスタンプリスト：\n${stickerList}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState(defaultText);
  const [showMessageInput, setShowMessageInput] = useState(false);

  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(stickers.length - 1, i + 1));

  const handleSend = async () => {
    setShowMessageInput(false);
    await onConfirm(message);
  };

  const current = stickers[currentIndex];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="slideshow"
    >
      {/* Header */}
      <div className="slideshow-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onClose} className="slideshow-back">
          <ChevronLeft size={28} />
        </button>
        <div className="slideshow-title">
          <span className="slideshow-label">最終チェック</span>
          <span className="slideshow-counter">
            {currentIndex + 1} / {stickers.length}
          </span>
        </div>
        {!isConfirmed ? (
          <button
            onClick={() => setShowMessageInput(true)}
            className="btn btn-green"
            disabled={isSending}
          >
            <Copy size={18} />
            {isSending ? '処理中...' : '確定してテキスト作成'}
          </button>
        ) : (
          <div className="confirmed-badge">✅ 確定済み</div>
        )}
      </div>

      {/* Main Sticker Display */}
      <div className="slideshow-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="slideshow-card"
          >
            {current && (
              <img src={current.url} alt="" className="slideshow-img" />
            )}
            <div className="slideshow-badge">{currentIndex + 1}</div>
          </motion.div>
        </AnimatePresence>

        {/* Nav Arrows */}
        <div className="slideshow-nav">
          <button onClick={prev} className="nav-arrow" disabled={currentIndex === 0}>
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={next}
            className="nav-arrow"
            disabled={currentIndex === stickers.length - 1}
          >
            <ChevronRight size={40} />
          </button>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="slideshow-strip">
        {stickers.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentIndex(i)}
            className={`strip-thumb ${currentIndex === i ? 'active' : ''}`}
          >
            <img src={s.url} alt="" className="strip-img" />
          </button>
        ))}
      </div>

      {/* Message Input Modal */}
      <AnimatePresence>
        {showMessageInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal"
            >
              <div className="modal-header">
                <h3>先生へのメッセージ</h3>
                <button onClick={() => setShowMessageInput(false)}>
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="modal-textarea"
                rows={10}
                placeholder="先生へのメッセージを入力..."
              />
              <button onClick={handleSend} className="btn btn-green btn-full">
                <Copy size={18} />
                送るテキストを作成してコピー
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
