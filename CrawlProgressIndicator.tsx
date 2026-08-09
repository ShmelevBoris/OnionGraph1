import React from 'react';

interface CrawlProgress {
  is_running: boolean;
  progress: {
    status: string;
    visited_count: number;
    queued_count?: number;
    current_domain: string;
  };
  visited_count: number;
  nodes_count: number;
  edges_count: number;
  queued_count?: number;
}

interface CrawlProgressIndicatorProps {
  progress: CrawlProgress;
}

export default function CrawlProgressIndicator({ progress }: CrawlProgressIndicatorProps) {
  const totalProcessed = progress.visited_count + progress.nodes_count;
  const queuedCount = progress.queued_count ?? progress.progress.queued_count ?? 0;
  const progressPercent = totalProcessed > 0 ? Math.min((progress.visited_count / (progress.visited_count + queuedCount)) * 100, 100) : 0;

  return (
    <div className="space-y-3 mt-4 p-4 bg-black/50 border border-cyan-400 rounded">
      <div className="flex items-center justify-between">
        <span className="text-cyan-400 font-mono text-sm">⟳ CRAWLING IN PROGRESS</span>
        <span className="text-pink-500 font-mono text-sm animate-pulse">
          {progress.progress.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
          <div>
            <p className="text-cyan-400 text-xs font-mono mb-1">
              Current: {progress.progress?.current_domain || 'Initializing...'}
            </p>
          <div className="w-full bg-black border border-cyan-400/30 h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <p className="text-cyan-400">Visited:</p>
            <p className="text-pink-500 text-lg font-bold">{progress.visited_count}</p>
          </div>
          <div>
            <p className="text-cyan-400">Queued:</p>
            <p className="text-pink-500 text-lg font-bold">{queuedCount}</p>
          </div>
          <div>
            <p className="text-cyan-400">Nodes:</p>
            <p className="text-pink-500 text-lg font-bold">{progress.nodes_count}</p>
          </div>
          <div>
            <p className="text-cyan-400">Edges:</p>
            <p className="text-pink-500 text-lg font-bold">{progress.edges_count}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
