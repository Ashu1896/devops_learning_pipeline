import os
import json
import logging
from pathlib import Path
from datetime import datetime
from src.config import PROGRESS_PATH, ROADMAP_PATH

# Professional logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path(__file__).resolve().parent.parent / "pipeline.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("DevOpsPipeline")

def get_clean_topic_name(topic: str) -> str:
    """
    Converts a topic name into a safe directory name (lowercase, replaced spaces/slashes with dashes).
    """
    safe_name = topic.lower().replace(" ", "-").replace("/", "-")
    # Remove any extra invalid characters
    return "".join(c for c in safe_name if c.isalnum() or c == "-")

def create_topic_folders(topic: str, part: int = 1) -> dict:
    """
    Creates and returns the structured folders for the given topic and part.
    """
    safe_topic = get_clean_topic_name(topic)
    base_topic_dir = Path(__file__).resolve().parent.parent / safe_topic / f"part{part}"
    
    dirs = {
        "base": base_topic_dir,
        "presentation": base_topic_dir / "presentation",
        "pdf": base_topic_dir / "pdf",
        "assets": base_topic_dir / "assets" / "diagrams",
        "notes": base_topic_dir / "notes"
    }
    
    for name, path in dirs.items():
        path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Ensured folder: {path}")
        
    return dirs

def load_progress() -> dict:
    """
    Loads progress tracking file, initializing it if corrupt or missing.
    """
    if not PROGRESS_PATH.exists():
        logger.warning("progress.json not found, initializing fresh structure...")
        init_progress()
        
    try:
        with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error("progress.json is corrupt, re-initializing...")
        init_progress()
        with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

def init_progress():
    """
    Creates fresh progress.json using roadmap.json, expanding each topic into 3 parts.
    """
    if not ROADMAP_PATH.exists():
        raise FileNotFoundError(f"roadmap.json is missing at {ROADMAP_PATH}. Cannot initialize progress.")
        
    with open(ROADMAP_PATH, "r", encoding="utf-8") as f:
        topics = json.load(f)
        
    pending = []
    for topic in topics:
        pending.append(f"{topic} (Part 1)")
        pending.append(f"{topic} (Part 2)")
        pending.append(f"{topic} (Part 3)")
        
    progress = {
        "completed": [],
        "pending": pending,
        "percentage": 0.0,
        "last_run": None,
        "history": []
    }
    
    save_progress(progress)

def save_progress(progress: dict):
    """
    Saves progress dict to progress.json.
    """
    with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)

def update_progress(completed_topic: str):
    """
    Moves a topic from pending to completed, updates percentage, and writes progress.
    """
    progress = load_progress()
    
    # Remove from pending if exists
    if completed_topic in progress["pending"]:
        progress["pending"].remove(completed_topic)
        
    # Append to completed if not exists
    if completed_topic not in progress["completed"]:
        progress["completed"].append(completed_topic)
        
    total_topics = len(progress["completed"]) + len(progress["pending"])
    if total_topics > 0:
        progress["percentage"] = round((len(progress["completed"]) / total_topics) * 100, 2)
        
    run_time = datetime.now().isoformat()
    progress["last_run"] = run_time
    progress["history"].append({
        "topic": completed_topic,
        "timestamp": run_time
    })
    
    save_progress(progress)
    logger.info(f"Progress updated: {completed_topic} marked completed. Completion: {progress['percentage']}%")
