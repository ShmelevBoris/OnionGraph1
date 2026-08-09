import time
import logging
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from crawler_api import CrawlRequest, crawl_onion_network, build_graph_response, crawler_state

logger = logging.getLogger("onion_api")
app = FastAPI(title="OnionGraphMapper API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для логирования времени ответа каждого .onion-запроса
@app.middleware("http")
async def log_onion_response_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000
    
    if "crawl" in request.url.path or "graph" in request.url.path:
        logger.info(f"[OnionRequest] Path: {request.url.path} | Method: {request.method} | Duration: {duration:.2f}ms | Status: {response.status_code}")
    
    response.headers["X-Response-Time-Ms"] = f"{duration:.2f}"
    return response

@app.post("/api/onion/crawl")
async def start_crawl(payload: CrawlRequest, background_tasks: BackgroundTasks):
    if crawler_state.is_running:
        return {"status": "already_running", "message": "Crawler is already active."}
    
    background_tasks.add_task(crawl_onion_network, payload.start_url, payload.depth)
    return {"status": "started", "start_url": payload.start_url, "depth": payload.depth}

@app.get("/api/onion/status")
async def get_crawl_status():
    return {
        "is_running": crawler_state.is_running,
        "progress": crawler_state.progress,
        "visited_count": len(crawler_state.visited),
        "nodes_count": len(crawler_state.nodes_data),
        "edges_count": len(crawler_state.edges)
    }

@app.get("/api/onion/graph")
async def get_graph():
    return build_graph_response()

@app.post("/api/onion/stop")
async def stop_crawl():
    crawler_state.is_running = False
    crawler_state.progress["status"] = "stopped"
    return {"status": "stopped"}
