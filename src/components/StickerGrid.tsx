import { Plus } from 'lucide-react';
import type { Sticker } from '@/types';

interface StickerGridProps {
  stickers: Sticker[];
  onSelect: (sticker: Sticker) => void;
  disabled?: boolean;
}

export function StickerGrid({ stickers, onSelect, disabled }: StickerGridProps) {
  if (stickers.length === 0) {
    return (
      <div className="empty-pool">
        <span>すべて選択済みです！</span>
      </div>
    );
  }

  return (
    <section className="section">
      <h2 className="section-title section-title--add">
        <Plus size={20} className="icon-green" />
        スタンプをえらぶ（タップして追加）
      </h2>
      <div className="sticker-grid">
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => !disabled && onSelect(sticker)}
            className="sticker-cell"
            disabled={disabled}
            title={`${sticker.categoryName} ${sticker.order}`}
          >
            <img
              src={sticker.url}
              alt={`${sticker.categoryName} スタンプ`}
              className="sticker-img"
              loading="lazy"
            />
            <div className="sticker-filename">
              {sticker.categoryName} {sticker.filename ? sticker.filename.replace(/\.[^/.]+$/, "") : sticker.order}
            </div>
            <div className="sticker-hover-overlay">
              <Plus size={20} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
