import { Reorder } from 'framer-motion';
import { GripVertical, RotateCcw, Sparkles, X } from 'lucide-react';
import type { Sticker } from '@/types';

interface SelectedListProps {
  stickers: Sticker[];
  isConfirmed: boolean;
  onReorder: (newOrder: Sticker[]) => void;
  onRemove: (sticker: Sticker) => void;
  onReset: () => void;
}

export function SelectedList({
  stickers,
  isConfirmed,
  onReorder,
  onRemove,
  onReset,
}: SelectedListProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">
          <Sparkles size={20} className="icon-yellow" />
          決定したスタンプ（並べ替え可能）
        </h2>
        <button
          onClick={onReset}
          className="btn-reset"
          style={isConfirmed ? { color: '#ef4444', borderColor: '#fee2e2', background: '#fee2e2' } : {}}
        >
          <RotateCcw size={14} />
          {isConfirmed ? 'ロック解除してやり直す' : 'リセット'}
        </button>
      </div>

      {stickers.length === 0 ? (
        <div className="empty-selected">
          <div className="empty-selected-icon">👇</div>
          <p>下のリストから使いたいスタンプをタップしてね！</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={stickers}
          onReorder={(newOrder) => !isConfirmed && onReorder(newOrder)}
          className="reorder-list"
        >
          {stickers.map((sticker, idx) => (
            <Reorder.Item
              key={sticker.id}
              value={sticker}
              dragListener={!isConfirmed}
              className="reorder-item"
            >
              <div className="reorder-number">{idx + 1}</div>
              <div className="reorder-img-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={sticker.url} alt="" className="reorder-img" />
                {sticker.filename && (
                  <div className="sticker-filename">
                    {sticker.filename.replace(/\.[^/.]+$/, "")}
                  </div>
                )}
              </div>
              <div className="reorder-actions">
                {!isConfirmed && (
                  <>
                    <div className="drag-handle">
                      <GripVertical size={24} />
                    </div>
                    <button
                      onClick={() => onRemove(sticker)}
                      className="btn-remove"
                    >
                      <X size={20} />
                    </button>
                  </>
                )}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </section>
  );
}
