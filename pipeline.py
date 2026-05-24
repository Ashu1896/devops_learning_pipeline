import sys
import argparse
import json
from pathlib import Path
from datetime import datetime
from src.config import get_api_client_config, BASE_DIR
from src.utils import (
    logger,
    load_progress,
    update_progress,
    create_topic_folders,
    get_clean_topic_name
)
from src.researcher import research_topic
from src.pdf_generator import compile_to_pdf
from src.ppt_generator import generate_pptx
from src.git_helper import git_commit_and_push
from src.email_helper import send_email_notification

def cleanup_old_assets(current_pdf: Path, current_pptx: Path):
    """
    Finds and deletes any other PDF or PPTX files in the project workspace to keep Git clean.
    """
    logger.info("Pruning old study manuals and presentations from workspace...")
    for ext in ["*.pdf", "*.pptx"]:
        for file_path in BASE_DIR.rglob(ext):
            if "venv" in file_path.parts or ".venv" in file_path.parts or ".git" in file_path.parts:
                continue
            if file_path.resolve() == current_pdf.resolve() or file_path.resolve() == current_pptx.resolve():
                continue
            try:
                file_path.unlink()
                logger.info(f"Deleted old asset: {file_path.relative_to(BASE_DIR)}")
            except Exception as e:
                logger.warning(f"Could not delete old asset {file_path}: {e}")

def print_progress_dashboard(progress: dict):
    """
    Renders a stunning ASCII-art CLI progress dashboard.
    """
    pct = progress.get("percentage", 0.0)
    completed = progress.get("completed", [])
    pending = progress.get("pending", [])
    
    total = len(completed) + len(pending)
    completed_cnt = len(completed)
    
    # Progress bar calculation
    bar_width = 30
    filled_len = int(round(bar_width * completed_cnt / total)) if total > 0 else 0
    bar = "=" * filled_len + "-" * (bar_width - filled_len)
    
    logger.info("=" * 60)
    logger.info("            DEVOPS LEARNING PIPELINE DASHBOARD")
    logger.info("=" * 60)
    logger.info(f" Completion Status: [{bar}] {pct}%")
    logger.info(f" Completed Topics:  {completed_cnt} / {total}")
    logger.info(f" Next Topic Up:     {pending[0] if pending else 'ALL TOPICS COMPLETED!'}")
    logger.info("-" * 60)
    if completed:
        logger.info(f" Last Studied:      {completed[-1]}")
    logger.info("=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description="DevOps automated study pipeline: sequential roadmaps, visually beautiful PPTX & PDF generator."
    )
    parser.add_argument("--dry-run", action="store_true", help="Simulate research content without burning API keys.")
    parser.add_argument("--topic", type=str, default=None, help="Process a specific topic instead of the sequential roadmap.")
    parser.add_argument("--force", action="store_true", help="Force regenerate a topic even if already marked completed.")
    args = parser.parse_args()
    
    # Load progress
    progress = load_progress()
    
    # Select Topic to Process
    selected_topic_with_part = None
    if args.topic:
        # User specified topic
        selected_topic = args.topic
        part = 1
        if " (Part " in selected_topic:
            selected_topic_with_part = selected_topic
            selected_topic, part_str = selected_topic.split(" (Part ")
            part = int(part_str.replace(")", ""))
        else:
            selected_topic_with_part = f"{selected_topic} (Part 1)"
            
        if selected_topic_with_part in progress["completed"] and not args.force:
            logger.warning(f"Topic part '{selected_topic_with_part}' was already completed. Use --force to regenerate.")
            sys.exit(0)
    else:
        # Sequential roadmap selection
        if not progress["pending"]:
            logger.info("Congratulations! All topics on the DevOps roadmap are completed.")
            sys.exit(0)
        selected_topic_with_part = progress["pending"][0]
        # Parse topic name and part
        if " (Part " in selected_topic_with_part:
            selected_topic, part_str = selected_topic_with_part.split(" (Part ")
            part = int(part_str.replace(")", ""))
        else:
            selected_topic = selected_topic_with_part
            part = 1
        
    logger.info(f"Pipeline started processing topic: '{selected_topic}' | Part: {part}")
    
    # Setup API config
    api_type, api_key = get_api_client_config()
    if not args.dry_run and not api_key:
        logger.warning("No API keys (GEMINI_API_KEY / OPENAI_API_KEY) found. Defaulting to Dry-Run (Mock Content).")
        args.dry_run = True
        
    # 1. Create Folder Structure
    logger.info("Ensuring folder structure...")
    folders = create_topic_folders(selected_topic, part=part)
    safe_name = get_clean_topic_name(selected_topic)
    
    # 2. Deep Research Gathering
    logger.info(f"Executing deep technical research for {selected_topic} Part {part}...")
    try:
        research_results = research_topic(selected_topic, api_type, api_key, part=part, dry_run=args.dry_run)
    except Exception as e:
        logger.error(f"Research failed: {e}")
        sys.exit(1)
        
    notes_content = research_results["notes"]
    interview_content = research_results["interview"]
    slides_data = research_results["slides"]
    
    topic_header = f"{selected_topic} - Part {part}"
    
    # 3. Save Compiled Study Guide Notes (markdown)
    logger.info("Writing study guide and notes...")
    notes_file = folders["notes"] / "summary.md"
    with open(notes_file, "w", encoding="utf-8") as f:
        f.write(f"# {topic_header} - Technical Study Guide & Notes\n\n")
        f.write(notes_content)
        f.write("\n\n")
        f.write(interview_content)
        
    # 4. Generate visual Presentation (PPTX)
    pptx_filename = f"{safe_name}-part{part}.pptx"
    pptx_file = folders["presentation"] / pptx_filename
    try:
        generate_pptx(topic_header, slides_data, pptx_file)
    except Exception as e:
        logger.error(f"PowerPoint generation failed: {e}")
        sys.exit(1)
        
    # 5. Compile gorgeous PDF manual with interactive PPTX link
    pdf_filename = f"{safe_name}-part{part}.pdf"
    pdf_file = folders["pdf"] / pdf_filename
    # Relative path reference from PDF folder to Presentation folder
    pptx_relative_link = f"../presentation/{pptx_filename}"
    try:
        compile_to_pdf(topic_header, notes_content, interview_content, pdf_file, pptx_relative_link)
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        sys.exit(1)
        
    # --- PRUNING OLD FILES ---
    cleanup_old_assets(pdf_file, pptx_file)
        
    # 6. Generate metadata.json
    logger.info("Writing metadata.json records...")
    metadata = {
        "topic": selected_topic,
        "part": part,
        "generated_at": datetime.now().isoformat(),
        "dry_run": args.dry_run,
        "engine": "Mock-Engine" if args.dry_run else api_type,
        "files": {
            "notes": f"/{safe_name}/part{part}/notes/summary.md",
            "pdf": f"/{safe_name}/part{part}/pdf/{pdf_filename}",
            "presentation": f"/{safe_name}/part{part}/presentation/{pptx_filename}"
        }
    }
    with open(folders["notes"] / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    # 7. Update progress state
    update_progress(selected_topic_with_part)
    
    # Reload and print updated dashboard
    updated_progress = load_progress()
    print_progress_dashboard(updated_progress)
    
    # --- EMAIL NOTIFICATION DELIVERY ---
    send_email_notification(
        selected_topic,
        part,
        pdf_file,
        pptx_file,
        updated_progress.get("percentage", 0.0)
    )
    
    # 8. Git Integration (Automatic check-in)
    git_commit_and_push(f"{selected_topic} (Part {part})", folders["base"])
    
    logger.info("Pipeline executed successfully.")

if __name__ == "__main__":
    main()
