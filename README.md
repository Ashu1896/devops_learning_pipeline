# DevOps automated learning pipeline

A fully automated production-ready SRE learning pipeline designed to transform a senior engineer (6+ years experience) into a Cloud Architect and Principal SRE within 6 months. 

Runs twice a week after 12:00 AM IST to sequentially research, generate, design, and log high-end study materials for 49 ordered DevOps roadmap topics.

---

## 🛠️ Stack & Cost Structure (100% Free)

* **Content Engine**: Google Gemini API (using the `gemini-1.5-flash` model, completely free tier with zero charge).
* **PDF Compilation**: `fpdf2` (pure-Python, open-source library running entirely locally).
* **Slide Generation**: `python-pptx` (pure-Python, open-source library running entirely locally).
* **File Hosting**: Clickable Git relative directory links (zero-cost storage on GitHub/GitLab).
* **Automation Orchestration**: Scheduled GitHub Actions or local CLI cron (100% free).

---

## 📁 Generated File Structure

For every topic (e.g. `linux`), the pipeline generates the following assets:

```
/linux
  ├── /presentation
  │     └── linux.pptx         # Beautiful 16:9 5-slide Indigo/Slate deck
  ├── /pdf
  │     └── linux.pdf          # Multi-page textbook guide with 20+ Interview Q&As & relative PPTX link
  ├── /assets
  │     └── /diagrams          # Folder for generated visual assets
  └── /notes
        ├── summary.md         # Full Markdown compiled textbook
        └── metadata.json      # Processing statistics & run history log
```

---

## 🚀 Getting Started

### 1. Prerequisite Setup

Ensure Python 3.10+ is installed on your local machine.

```bash
# Clone the repository
git clone <your-repo-link>
cd Agentic_AI

# Create a virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate   # On Unix/macOS

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your free Gemini API key:

```bash
cp .env.example .env
```

Open `.env` and add your free Google AI Studio token:
```ini
GEMINI_API_KEY=AIzaSy...
GIT_REMOTE_PUSH=false
```

---

## 💻 Running the Pipeline

### Local CLI Commands

1. **Dry-Run Mode (Offline Validation)**
   Simulates content gathering using high-fidelity local templates without making API calls. Perfect for testing layout, PDF generation, and slide designs instantly:
   ```bash
   python pipeline.py --dry-run
   ```

2. **Sequential Live Run**
   Automatically picks the next uncompleted topic from `progress.json` and researches it live:
   ```bash
   python pipeline.py
   ```

3. **Force Run Specific Topic**
   Generates or regenerates a specific topic on demand:
   ```bash
   python pipeline.py --topic "Kubernetes" --force
   ```

---

## 🤖 GitHub Actions Automation

To run the pipeline twice a week automatically, set up the workflow inside GitHub:

### 1. Workflow Settings
Create a file at `.github/workflows/devops_pipeline.yml` (already provided by the pipeline generator).

### 2. Add Your Free API Key as a Secret
Go to your repository on GitHub:
1. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Name: `GEMINI_API_KEY`.
4. Value: Paste your Google Gemini API key.

### 3. Grant Write Permissions
To allow GitHub Actions to commit and push the generated materials back to the repository:
1. Navigate to **Settings** -> **Actions** -> **General**.
2. Scroll to the bottom to **Workflow permissions**.
3. Select **"Read and write permissions"**.
4. Click **Save**.

The workflow is scheduled to trigger at `0 20 * * 2,5` UTC (every Tuesday and Friday at 8:00 PM UTC), which matches **1:30 AM IST Wednesday and Saturday** (safely after the 12:00 AM IST requirement).
