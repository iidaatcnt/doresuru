import { useState, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { CATEGORIES } from '@/types';
import type { StickerDoc } from '@/types';
import { Upload, Trash2, X, LogOut, ImageIcon, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';

interface AdminPanelProps {
  onClose: () => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  category: string;
  progress: 'pending' | 'uploading' | 'done' | 'error';
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [stickers, setStickers] = useState<(StickerDoc & { firestoreId: string })[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStickers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = collection(db, 'stickers');
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        firestoreId: d.id,
        ...(d.data() as StickerDoc),
      }));
      data.sort((a, b) => {
        if (a.category === b.category) return a.order - b.order;
        return a.category.localeCompare(b.category);
      });
      setStickers(data);
    } catch (e) {
      setError('読み込みに失敗しました');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  // ファイル選択時プレビューキューに追加（ZIP対応）
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsLoading(true);

    try {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') {
          const zip = await JSZip.loadAsync(file);
          const imageFiles: File[] = [];

          for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir || filename.startsWith('__MACOSX/') || filename.startsWith('.')) continue;
            
            const ext = filename.split('.').pop()?.toLowerCase() || '';
            if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) continue;

            const blob = await zipEntry.async('blob');
            const baseName = filename.split('/').pop() || `extracted_${Date.now()}.${ext}`;
            const extractedFile = new File([blob], baseName, { type: `image/${ext === 'jpeg' ? 'jpeg' : ext}` });
            imageFiles.push(extractedFile);
          }

          const newItems: UploadingFile[] = imageFiles.map((imgFile) => ({
            file: imgFile,
            preview: URL.createObjectURL(imgFile),
            category: selectedCategory,
            progress: 'pending',
          }));
          setUploadQueue((prev) => [...prev, ...newItems]);
        } else {
          // 通常の画像ファイル
          setUploadQueue((prev) => [
            ...prev,
            {
              file,
              preview: URL.createObjectURL(file),
              category: selectedCategory,
              progress: 'pending',
            },
          ]);
        }
      }
    } catch (err) {
      console.error('ZIP unzipping error:', err);
      setError('ファイルの展開中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const removeFromQueue = (idx: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  // アップロード実行
  const handleUpload = async () => {
    if (uploadQueue.length === 0) return;
    setIsUploading(true);
    setError(null);

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      setUploadQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, progress: 'uploading' } : q))
      );

      try {
        // カテゴリ内の既存スタンプ数でorder決定
        const catStickers = stickers.filter((s) => s.category === item.category);
        const nextOrder = catStickers.length + 1;
        const ext = item.file.name.split('.').pop() || 'png';
        const storagePath = `stickers/${item.category}/${Date.now()}.${ext}`;

        // Firebase Storage にアップロード
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, item.file);
        const downloadUrl = await getDownloadURL(storageRef);

        // Firestore にメタデータ保存
        const catName = CATEGORIES.find((c) => c.id === item.category)?.name || item.category;
        await addDoc(collection(db, 'stickers'), {
          category: item.category,
          categoryName: catName,
          filename: item.file.name,
          storagePath,
          downloadUrl,
          order: nextOrder,
          createdAt: serverTimestamp(),
        });

        setUploadQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, progress: 'done' } : q))
        );
      } catch (e) {
        console.error('Upload error:', e);
        setUploadQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, progress: 'error' } : q))
        );
        setError(`${item.file.name} のアップロードに失敗しました`);
      }
    }

    setIsUploading(false);
    // 完了後にリロード
    await loadStickers();
    setUploadQueue((prev) => prev.filter((q) => q.progress !== 'done'));
  };

  // スタンプ削除
  const handleDelete = async (sticker: StickerDoc & { firestoreId: string }) => {
    if (!confirm(`このスタンプを削除しますか？\n(${sticker.storagePath})`)) return;
    try {
      // Storage から削除
      const storageRef = ref(storage, sticker.storagePath);
      await deleteObject(storageRef).catch(() => {/* 既に削除済みの場合は無視 */});
      // Firestore から削除
      await deleteDoc(doc(db, 'stickers', sticker.firestoreId));
      setStickers((prev) => prev.filter((s) => s.firestoreId !== sticker.firestoreId));
    } catch (e) {
      console.error('Delete error:', e);
      setError('削除に失敗しました');
    }
  };

  // スタンプ一括削除
  const handleDeleteAll = async () => {
    if (!window.confirm('本当によろしいですか？\n登録済みのすべてのスタンプが【完全に消去】され元に戻せません！')) return;
    setIsLoading(true);
    try {
      // Storage と Firestore から全て削除
      for (const sticker of stickers) {
        const storageRef = ref(storage, sticker.storagePath);
        await deleteObject(storageRef).catch(() => {});
        await deleteDoc(doc(db, 'stickers', sticker.firestoreId));
      }
      setStickers([]);
      alert('すべてのスタンプを削除しました。');
    } catch (e) {
      console.error('Delete All error:', e);
      setError('一括削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const progressLabel = {
    pending: '⏳',
    uploading: '⬆️',
    done: '✅',
    error: '❌',
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">🎨 先生管理画面</h1>
          <button onClick={onClose} className="admin-close">
            <LogOut size={20} />
            閉じる
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <X size={16} />
            {error}
            <button onClick={() => setError(null)}>閉じる</button>
          </div>
        )}

        {/* === Upload Section === */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <Upload size={18} />
            スタンプをアップロード
          </h2>

          <div className="upload-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-select"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="btn btn-green upload-label">
              <ImageIcon size={18} />
              ファイル / ZIPを選ぶ
              <input
                type="file"
                accept="image/*,.zip"
                multiple
                onChange={handleFilePick}
                className="hidden-input"
              />
            </label>
          </div>

          {uploadQueue.length > 0 && (
            <div className="upload-queue">
              <div className="queue-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button 
                  onClick={() => setUploadQueue([])} 
                  disabled={isUploading}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={14} /> リストを全てクリア
                </button>
              </div>
              {uploadQueue.map((item, i) => (
                <div key={i} className="queue-item">
                  <img src={item.preview} alt="" className="queue-preview" />
                  <div className="queue-info">
                    <span className="queue-filename">{item.file.name}</span>
                    <span className="queue-cat">
                      {CATEGORIES.find((c) => c.id === item.category)?.name}
                    </span>
                  </div>
                  <span className="queue-status">{progressLabel[item.progress]}</span>
                  {item.progress === 'pending' && (
                    <button onClick={() => removeFromQueue(i)} className="queue-remove">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleUpload}
                disabled={isUploading || uploadQueue.every((q) => q.progress === 'done')}
                className="btn btn-green btn-full"
              >
                <Upload size={18} />
                {isUploading ? 'アップロード中...' : `${uploadQueue.length}枚をアップロード`}
              </button>
            </div>
          )}
        </section>

        {/* === Sticker List Section === */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              <ImageIcon size={18} />
              登録済みスタンプ一覧
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={loadStickers} className="btn-icon" disabled={isLoading} title="更新">
                <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isLoading || stickers.length === 0}
                className="btn btn-white"
                style={{ color: 'var(--red)', fontSize: '13px', padding: '6px 12px' }}
              >
                <Trash2 size={16} />すべて消す
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-center">読み込み中...</div>
          ) : stickers.length === 0 ? (
            <div className="empty-admin">
              <p>まだスタンプが登録されていません。</p>
              <p>上からアップロードしてください。</p>
            </div>
          ) : (
            <div className="admin-sticker-grid">
              {stickers.map((sticker) => (
                <div key={sticker.firestoreId} className="admin-sticker-card">
                  <img src={sticker.downloadUrl} alt="" className="admin-sticker-img" />
                  <div className="admin-sticker-meta" style={{ flexWrap: 'wrap' }}>
                    <span className="admin-cat-badge">
                      {sticker.categoryName} {sticker.filename ? sticker.filename : `#${sticker.order}`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(sticker)}
                    className="admin-delete-btn"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
