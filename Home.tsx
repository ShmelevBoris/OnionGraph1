import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import GraphVisualizer from '../components/GraphVisualizer';
import NodeDetailPanel from '../components/NodeDetailPanel';
import CrawlProgressIndicator from '../components/CrawlProgressIndicator';

export default function Home() {
  const [startUrl, setStartUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [isCrawling, setIsCrawling] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [crawlProgress, setCrawlProgress] = useState<any>({
    is_running: false,
    progress: { status: 'idle', visited_count: 0, queued_count: 0, current_domain: '' },
    visited_count: 0,
    nodes_count: 0,
    edges_count: 0
  });

  // Функция для запуска краулера
  const handleStartCrawl = async () => {
    if (!startUrl.trim()) {
      alert('Please enter a valid .onion domain');
      return;
    }

    setIsCrawling(true);
    setCrawlProgress({ is_running: true, progress: { status: 'running', visited_count: 0, queued_count: 0, current_domain: startUrl }, visited_count: 0, nodes_count: 0, edges_count: 0 });

    try {
      // Запуск краулера
      const crawlResponse = await fetch('/api/onion/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_url: startUrl, depth })
      });

      if (!crawlResponse.ok) {
        throw new Error('Failed to start crawl');
      }

      // Опрос статуса краулера
      let isRunning = true;
      while (isRunning) {
        const statusResponse = await fetch('/api/onion/status');
        const status = await statusResponse.json();
        setCrawlProgress(status);

        if (!status.is_running) {
          isRunning = false;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Получение графа
      const graphResponse = await fetch('/api/onion/graph');
      const graph = await graphResponse.json();
      setGraphData(graph);
      } catch (error) {
        console.error('Crawl error:', error);
        alert('Error during crawl: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCrawling(false);
    }
  };

  // Фильтрация узлов по поисковому запросу
  const filteredNodes = graphData?.nodes.filter((node: any) =>
    node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const highlightedNodeIds = new Set<string>(filteredNodes.map((n: any) => n.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black grid-cyberpunk">
      {/* Header */}
      <header className="border-b-2 border-pink-500 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <h1 className="text-4xl font-bold neon-glow">
            ◆ ONION GRAPH MAPPER ◆
          </h1>
          <p className="text-cyan-400 text-sm mt-2 font-mono">
            Decentralized Darknet Network Visualization Engine
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Control Panel */}
        <Card className="card-cyberpunk mb-8 border-2 border-pink-500">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold neon-glow">⚡ INITIATE SCAN</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-cyan-400 font-mono text-sm mb-2">
                  START URL (.onion domain)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., example.onion"
                  value={startUrl}
                  onChange={(e) => setStartUrl(e.target.value)}
                  className="input-cyberpunk bg-black/70 border-cyan-400 text-cyan-400 placeholder-cyan-600"
                  disabled={isCrawling}
                />
              </div>

              <div>
                <label className="block text-cyan-400 font-mono text-sm mb-2">
                  CRAWL DEPTH
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="input-cyberpunk bg-black/70 border-cyan-400 text-cyan-400"
                  disabled={isCrawling}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleStartCrawl}
                  disabled={isCrawling}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold uppercase border-2 border-pink-500 neon-glow"
                >
                  {isCrawling ? '⟳ SCANNING...' : '▶ START SCAN'}
                </Button>
              </div>
            </div>

            {/* Progress Indicator */}
            {isCrawling && <CrawlProgressIndicator progress={crawlProgress} />}
          </div>
        </Card>

        {/* Search and Filter */}
        {graphData && (
          <Card className="card-cyberpunk mb-8 border-2 border-cyan-400">
            <div className="space-y-2">
              <label className="block text-pink-500 font-mono text-sm">
                🔍 SEARCH NODES
              </label>
              <Input
                type="text"
                placeholder="Search by domain or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-cyberpunk bg-black/70 border-cyan-400 text-cyan-400 placeholder-cyan-600"
              />
              <p className="text-cyan-400 text-xs font-mono">
                Found: {filteredNodes.length} / {graphData.nodes.length} nodes
              </p>
            </div>
          </Card>
        )}

        {/* Graph and Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph Visualization */}
          <div className="lg:col-span-3">
            {graphData ? (
              <GraphVisualizer
                data={graphData}
                onNodeClick={(node: any) => setSelectedNode(node)}
                highlightedNodes={highlightedNodeIds}
              />
            ) : (
              <Card className="card-cyberpunk border-2 border-pink-500 h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-cyan-400 text-lg font-mono mb-4">
                    ◆ AWAITING INITIALIZATION ◆
                  </p>
                  <p className="text-pink-500 text-sm">
                    Enter a .onion domain and initiate scan to begin mapping the network
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-1">
            {selectedNode ? (
              <NodeDetailPanel node={selectedNode} />
            ) : (
              <Card className="card-cyberpunk border-2 border-cyan-400 h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-cyan-400 text-sm font-mono">
                    ◆ SELECT NODE ◆
                  </p>
                  <p className="text-pink-500 text-xs mt-2">
                    Click on a node in the graph to view details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Graph Statistics */}
        {graphData && (
          <Card className="card-cyberpunk mt-8 border-2 border-pink-500">
            <h3 className="text-lg font-bold neon-glow mb-4">📊 NETWORK STATISTICS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-cyan-400 font-mono text-sm">Total Nodes</p>
                <p className="text-pink-500 text-2xl font-bold">{graphData.stats.total_nodes}</p>
              </div>
              <div className="text-center">
                <p className="text-cyan-400 font-mono text-sm">Total Edges</p>
                <p className="text-pink-500 text-2xl font-bold">{graphData.stats.total_edges}</p>
              </div>
              <div className="text-center">
                <p className="text-cyan-400 font-mono text-sm">Density</p>
                <p className="text-pink-500 text-2xl font-bold">{graphData.stats.density}</p>
              </div>
              <div className="text-center">
                <p className="text-cyan-400 font-mono text-sm">Status</p>
                <p className="text-green-400 text-2xl font-bold">✓ READY</p>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-pink-500 bg-black/50 mt-12 py-4 text-center">
        <p className="text-cyan-400 text-xs font-mono">
          OnionGraphMapper v1.0 | Cyberpunk Darknet Visualization | Secure & Anonymous
        </p>
      </footer>
    </div>
  );
}
