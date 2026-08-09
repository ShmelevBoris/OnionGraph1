import { Router, type Request, type Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Состояние краулера
interface CrawlerState {
  isRunning: boolean;
  progress: {
    status: string;
    visited_count: number;
    queued_count: number;
    current_domain: string;
  };
  visited_count: number;
  nodes_count: number;
  edges_count: number;
  graphData: any;
}

const crawlerState: CrawlerState = {
  isRunning: false,
  progress: {
    status: 'idle',
    visited_count: 0,
    queued_count: 0,
    current_domain: ''
  },
  visited_count: 0,
  nodes_count: 0,
  edges_count: 0,
  graphData: null
};

// Middleware для логирования времени ответа
router.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.includes('/onion/')) {
      console.log(`[OnionRequest] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Запуск краулера
router.post('/onion/crawl', async (req: Request, res: Response) => {
  const { start_url, depth = 2 } = req.body;

  if (!start_url) {
    return res.status(400).json({ error: 'start_url is required' });
  }

  if (crawlerState.isRunning) {
    return res.status(409).json({ status: 'already_running', message: 'Crawler is already active' });
  }

  crawlerState.isRunning = true;
  crawlerState.progress = {
    status: 'running',
    visited_count: 0,
    queued_count: 1,
    current_domain: start_url
  };

  res.json({ status: 'started', start_url, depth });

  // Запуск Python краулера в фоне
  runCrawler(start_url, depth);
});

// Получение статуса краулера
router.get('/onion/status', (req: Request, res: Response) => {
  res.json(crawlerState);
});

// Получение графа
router.get('/onion/graph', (req: Request, res: Response) => {
  if (!crawlerState.graphData) {
    return res.json({
      nodes: [],
      edges: [],
      stats: { total_nodes: 0, total_edges: 0, density: 0 }
    });
  }
  res.json(crawlerState.graphData);
});

// Остановка краулера
router.post('/onion/stop', (req: Request, res: Response) => {
  crawlerState.isRunning = false;
  crawlerState.progress.status = 'stopped';
  res.json({ status: 'stopped' });
});

// Функция для запуска Python краулера
function runCrawler(startUrl: string, depth: number) {
  const pythonScript = path.join(__dirname, 'crawler_cli.py');

  const python = spawn('python3', [pythonScript, '--url', startUrl, '--depth', String(depth)]);

  let output = '';
  let errorOutput = '';

  python.stdout.on('data', (data) => {
    output += data.toString();
    try {
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const progress = JSON.parse(line.replace('PROGRESS:', ''));
          crawlerState.progress = progress;
        } else if (line.startsWith('GRAPH:')) {
          const graph = JSON.parse(line.replace('GRAPH:', ''));
          crawlerState.graphData = graph;
          crawlerState.nodes_count = graph.nodes.length;
          crawlerState.edges_count = graph.edges.length;
        }
      }
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error(`[Crawler Error] ${data}`);
  });

  python.on('close', (code) => {
    crawlerState.isRunning = false;
    crawlerState.progress.status = code === 0 ? 'completed' : 'error';
    console.log(`[Crawler] Process exited with code ${code}`);
  });
}

export default router;
