import { Play, Settings } from 'lucide-react';

interface HeaderProps {
  selectedCount: number;
  isSyncing: boolean;
  isConfirmed: boolean;
  onShowSlideshow: () => void;
  onAdminClick: () => void;
}

export function Header({
  selectedCount,
  isSyncing,
  isConfirmed,
  onShowSlideshow,
  onAdminClick,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-status">
          <div className={`sync-dot ${isSyncing ? 'syncing' : ''}`} />
          <span>{isSyncing ? '保存中...' : '保存済み'}</span>
          <span className="header-title">STAMP ARRANGER</span>
        </div>

        <div className="header-main">
          <div className="selected-count">
            <span className="selected-count-label">選んだ数</span>
            <div className="selected-count-number">
              <span className="count-big">{selectedCount}</span>
              <span className="count-unit">枚</span>
            </div>
          </div>

          <div className="header-actions">
            {isConfirmed && (
              <div className="confirmed-badge">✅ 確定済み</div>
            )}
            <button
              onClick={onShowSlideshow}
              disabled={selectedCount === 0}
              className="btn btn-white"
            >
              <Play size={18} />
              確認する
            </button>
            <button
              onClick={onAdminClick}
              className="btn-icon"
              title="管理者"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
