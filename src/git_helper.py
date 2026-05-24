import os
import subprocess
from pathlib import Path
from src.utils import logger
from src.config import GIT_REMOTE_PUSH

def run_git_cmd(args: list, cwd: Path) -> str:
    """
    Executes a git command and returns the trimmed output.
    """
    try:
        res = subprocess.run(
            args,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git execution failed (command: {' '.join(args)}): {e.stderr}")
        raise e

def git_commit_and_push(topic_name: str, topic_dir: Path):
    """
    Stages the generated topic directory and progress files, commits them, and pushes if configured.
    """
    from src.config import BASE_DIR
    base_dir = BASE_DIR
    logger.info(f"Initiating Git check-in for topic: {topic_name} at root {base_dir}")
    
    # Check if this directory is actually a Git repository
    if not (base_dir / ".git").exists():
        # Check parent folders as well
        try:
            run_git_cmd(["git", "rev-parse", "--is-inside-work-tree"], base_dir)
        except Exception:
            logger.warning("Target folder is not a Git repository. Skipping Git commit integration.")
            return
            
    try:
        # Stage generated folder, progress.json, and pipeline.log
        relative_topic_path = topic_dir.relative_to(base_dir)
        
        logger.info("Staging files...")
        run_git_cmd(["git", "add", str(relative_topic_path)], base_dir)
        run_git_cmd(["git", "add", "progress.json"], base_dir)
        if (base_dir / "pipeline.log").exists():
            run_git_cmd(["git", "add", "pipeline.log"], base_dir)
            
        # Commit changes
        commit_msg = f"Added DevOps Learning Content - {topic_name}"
        logger.info(f"Creating commit: '{commit_msg}'")
        run_git_cmd(["git", "commit", "-m", commit_msg], base_dir)
        
        # Optional push to remote
        if GIT_REMOTE_PUSH:
            logger.info("Pushing committed changes to remote repository...")
            run_git_cmd(["git", "push"], base_dir)
            logger.info("Successfully pushed changes.")
        else:
            logger.info("Remote push disabled. Local commit created successfully.")
            
    except Exception as e:
        logger.error(f"Failed Git check-in workflow: {e}")
