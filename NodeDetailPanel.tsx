import React from 'react';
import { Card } from '@/components/ui/card';

interface Node {
  id: string;
  label: string;
  title: string;
  text_preview: string;
  pagerank: number;
  cluster: number;
  color: string;
  size: number;
  in_degree: number;
  out_degree: number;
}

interface NodeDetailPanelProps {
  node: Node;
}

export default function NodeDetailPanel({ node }: NodeDetailPanelProps) {
  return (
    <Card className="card-cyberpunk border-2 border-cyan-400 h-full overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold neon-glow-cyan mb-2">◆ NODE DETAILS</h3>
        </div>

        {/* Color Indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border-2 border-pink-500"
            style={{ backgroundColor: node.color }}
          />
          <span className="text-cyan-400 text-sm font-mono">Cluster {node.cluster}</span>
        </div>

        {/* Domain */}
        <div>
          <p className="text-pink-500 text-xs font-mono mb-1">DOMAIN</p>
          <p className="text-cyan-400 text-sm font-mono break-all bg-black/50 p-2 border border-cyan-400/30">
            {node.id}
          </p>
        </div>

        {/* Title */}
        <div>
          <p className="text-pink-500 text-xs font-mono mb-1">PAGE TITLE</p>
          <p className="text-cyan-400 text-sm font-mono bg-black/50 p-2 border border-cyan-400/30 line-clamp-3">
            {node.title || 'N/A'}
          </p>
        </div>

        {/* Text Preview */}
        <div>
          <p className="text-pink-500 text-xs font-mono mb-1">TEXT PREVIEW (200 chars)</p>
          <p className="text-cyan-400 text-xs font-mono bg-black/50 p-2 border border-cyan-400/30 line-clamp-4 h-20 overflow-y-auto">
            {node.text_preview || 'No text available'}
          </p>
        </div>

        {/* Metrics */}
        <div className="border-t border-cyan-400/30 pt-4">
          <p className="text-pink-500 text-xs font-mono mb-3">METRICS</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-cyan-400">PageRank:</span>
              <span className="text-pink-500 font-mono">{node.pagerank.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">Node Size:</span>
              <span className="text-pink-500 font-mono">{node.size.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">In-Degree:</span>
              <span className="text-pink-500 font-mono">{node.in_degree}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">Out-Degree:</span>
              <span className="text-pink-500 font-mono">{node.out_degree}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-cyan-400/30 pt-4 text-xs text-cyan-400 font-mono">
          <p className="mb-2">◆ LEGEND</p>
          <ul className="space-y-1 text-xs">
            <li>• Size = PageRank (importance)</li>
            <li>• Color = Topic cluster</li>
            <li>• In-Degree = Incoming links</li>
            <li>• Out-Degree = Outgoing links</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
