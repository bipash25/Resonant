import { useState, useRef } from 'react';
import { X, GripVertical, Play, Trash2, Music } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../types';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { queue, queueIndex, jumpTo, removeFromQueue, reorderQueue, clearQueue } = usePlayerStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.target as HTMLDivElement;
    dragNodeRef.current.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderQueue(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const upNext = queue.slice(queueIndex + 1);
  const currentTrack = queue[queueIndex];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div 
        className="w-full max-w-md bg-[#121212] h-full flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282828]">
          <h2 className="text-lg font-bold text-white">Queue</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#282828] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#b3b3b3]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase mb-3">Now Playing</h3>
              <QueueItem
                track={currentTrack}
                isPlaying={true}
                onPlay={() => {}}
                onRemove={() => {}}
                isDragging={false}
                isDragOver={false}
                disableDrag={true}
              />
            </div>
          )}

          {/* Up Next */}
          {upNext.length > 0 && (
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#b3b3b3] uppercase">
                  Next Up ({upNext.length})
                </h3>
                <button
                  onClick={clearQueue}
                  className="text-xs text-[#b3b3b3] hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {upNext.map((track, i) => {
                  const actualIndex = queueIndex + 1 + i;
                  return (
                    <div
                      key={`${track.id}-${actualIndex}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, actualIndex)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                    >
                      <QueueItem
                        track={track}
                        isPlaying={false}
                        onPlay={() => jumpTo(actualIndex)}
                        onRemove={() => removeFromQueue(actualIndex)}
                        isDragging={draggedIndex === actualIndex}
                        isDragOver={dragOverIndex === actualIndex}
                        disableDrag={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {queue.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-[#b3b3b3]">
              <Music className="w-12 h-12 mb-4 opacity-50" />
              <p>Your queue is empty</p>
              <p className="text-sm mt-1">Add some tracks to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Queue Item Component
function QueueItem({
  track,
  isPlaying,
  onPlay,
  onRemove,
  isDragging,
  isDragOver,
  disableDrag
}: {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  disableDrag: boolean;
}) {
  const thumbnailUrl = track.coverUrl || '/icon.svg';

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md group transition-all cursor-pointer ${
        isPlaying 
          ? 'bg-[#1ed760]/20' 
          : isDragOver 
            ? 'bg-[#3e3e3e] border-t-2 border-[#1ed760]' 
            : 'hover:bg-[#282828]'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={onPlay}
    >
      {/* Drag Handle */}
      {!disableDrag && (
        <div className="cursor-grab active:cursor-grabbing text-[#b3b3b3] opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
        <img
          src={thumbnailUrl}
          alt={track.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/icon.svg';
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
      </div>

      {/* Actions */}
      {!isPlaying && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="p-2 hover:bg-[#3e3e3e] rounded-full transition-colors"
          >
            <Play className="w-4 h-4 text-white" fill="white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-2 hover:bg-[#3e3e3e] rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4 text-[#b3b3b3] hover:text-red-500" />
          </button>
        </div>
      )}

      {/* Playing Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-0.5">
          <span className="w-1 h-3 bg-[#1ed760] rounded-full animate-pulse"></span>
          <span className="w-1 h-4 bg-[#1ed760] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-1 h-2 bg-[#1ed760] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
        </div>
      )}
    </div>
  );
}
