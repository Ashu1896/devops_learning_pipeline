import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
ROADMAP_PATH = BASE_DIR / "roadmap.json"
PROGRESS_PATH = BASE_DIR / "progress.json"

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Git config
GIT_REMOTE_PUSH = os.getenv("GIT_REMOTE_PUSH", "true").lower() == "true"

def get_api_client_config():
    """
    Returns the configured API type and key, defaulting to Gemini.
    """
    if GEMINI_API_KEY:
        return "gemini", GEMINI_API_KEY
    elif OPENAI_API_KEY:
        return "openai", OPENAI_API_KEY
    return None, None
