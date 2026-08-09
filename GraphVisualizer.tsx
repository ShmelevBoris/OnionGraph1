import React, { useEffect, useRef } from 'react';
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

interface Edge {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    density: number;
  };
}

interface GraphVisualizerProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  highlightedNodes: Set<string>;
}

export default function GraphVisualizer({ data, onNodeClick, highlightedNodes }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.nodes.length === 0) return;

    // Динамическая загрузка Plotly
    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
    script.async = true;
    script.onload = () => {
      renderGraph();
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [data, highlightedNodes]);

  const renderGraph = () => {
    // Используем замыкание для доступа к data
    if (!containerRef.current || !data) return;

    const Plotly = (window as any).Plotly;
    if (!Plotly) return;
    if (!data.nodes || data.nodes.length === 0) return;

    // Построение 3D координат для узлов (используем Force-directed layout)
    const nodePositions: { [key: string]: [number, number, number] } = {};
    const nodeCount = data.nodes.length;

    // Простой Force-directed layout в 3D
    data.nodes.forEach((node, index) => {
      const angle = (index / nodeCount) * Math.PI * 2;
      const radius = 10 + (node.pagerank * 20);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = (Math.random() - 0.5) * 10;
      nodePositions[node.id] = [x as number, y as number, z as number];
    });

    // Подготовка данных для Plotly
    const nodeX: number[] = [];
    const nodeY: number[] = [];
    const nodeZ: number[] = [];
    const nodeText: string[] = [];
    const nodeColor: string[] = [];
    const nodeSize: number[] = [];
    const nodeHoverText: string[] = [];

    data.nodes.forEach(node => {
      const [x, y, z] = nodePositions[node.id];
      nodeX.push(x);
      nodeY.push(y);
      nodeZ.push(z);
      nodeText.push(node.label);
      nodeColor.push(node.color);
      nodeSize.push(node.size);
      nodeHoverText.push(
        `<b>${node.title}</b><br>Domain: ${node.id}<br>PageRank: ${node.pagerank}<br>In-Degree: ${node.in_degree}<br>Out-Degree: ${node.out_degree}`
      );
    });

    // Подготовка ребер
    const edgeX: number[] = [];
    const edgeY: number[] = [];
    const edgeZ: number[] = [];

    data.edges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      if (sourcePos && targetPos) {
        edgeX.push(sourcePos[0], targetPos[0]);
        edgeY.push(sourcePos[1], targetPos[1]);
        edgeZ.push(sourcePos[2], targetPos[2]);
      }
    });

    // Трассировка ребер
    const edgeTrace = {
      x: edgeX,
      y: edgeY,
      z: edgeZ,
      mode: 'lines' as const,
      line: {
        color: 'rgba(0, 240, 255, 0.3)',
        width: 1
      },
      hoverinfo: 'none' as const,
      type: 'scatter3d' as const
    };

    // Трассировка узлов
    const nodeTrace = {
      x: nodeX,
      y: nodeY,
      z: nodeZ,
      mode: 'markers+text' as const,
      text: nodeText,
      textposition: 'top center' as const,
      textfont: {
        color: '#ff007f',
        size: 10,
        family: 'Orbitron, sans-serif'
      },
      hovertext: nodeHoverText,
      hoverinfo: 'text' as const,
      marker: {
        size: nodeSize,
        color: nodeColor,
        opacity: highlightedNodes.size === 0 ? 0.8 : 0.4,
        line: {
          color: 'rgba(255, 0, 127, 0.8)',
          width: 1
        },
        symbol: 'circle'
      },
      type: 'scatter3d' as const
    };

    // Обновление прозрачности для выделенных узлов
    if (highlightedNodes.size > 0) {
      const updatedOpacity: number[] = [];
      data.nodes.forEach(node => {
        updatedOpacity.push(highlightedNodes.has(node.id) ? 1.0 : 0.2);
      });
      (nodeTrace.marker as any).opacity = updatedOpacity;
    }

    const layout = {
      title: {
        text: '<b>ONION NETWORK 3D GRAPH</b>',
        font: {
          color: '#ff007f',
          size: 20,
          family: 'Orbitron, sans-serif'
        }
      },
      showlegend: false,
      hovermode: 'closest' as const,
      margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 40
      },
      paper_bgcolor: 'rgba(0, 0, 0, 0.8)',
      plot_bgcolor: 'rgba(0, 0, 0, 0.9)',
      scene: {
        xaxis: {
          backgroundcolor: 'rgba(0, 0, 0, 0.5)',
          gridcolor: 'rgba(255, 0, 127, 0.1)',
          showbackground: true,
          zeroline: false,
          color: '#00f0ff'
        },
        yaxis: {
          backgroundcolor: 'rgba(0, 0, 0, 0.5)',
          gridcolor: 'rgba(0, 240, 255, 0.1)',
          showbackground: true,
          zeroline: false,
          color: '#00f0ff'
        },
        zaxis: {
          backgroundcolor: 'rgba(0, 0, 0, 0.5)',
          gridcolor: 'rgba(255, 0, 127, 0.1)',
          showbackground: true,
          zeroline: false,
          color: '#ff007f'
        },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      font: {
        family: 'Space Mono, monospace',
        color: '#00f0ff'
      }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'onion_graph.png',
        height: 800,
        width: 1200,
        scale: 1
      }
    };

    Plotly.newPlot(containerRef.current, [edgeTrace, nodeTrace], layout, config);

    // Обработка кликов на узлы
    (containerRef.current as any).on('plotly_click', (clickData: any) => {
      if (clickData.points.length > 0) {
        const pointIndex = clickData.points[0].pointNumber;
        if (pointIndex >= 0 && pointIndex < data.nodes.length) {
          const clickedNode = data.nodes[pointIndex];
          onNodeClick(clickedNode);
        }
      }
    });
  };

  return (
    <Card className="card-cyberpunk border-2 border-pink-500 p-0 overflow-hidden">
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(25,10,46,0.9) 100%)'
        }}
      />
    </Card>
  );
}
