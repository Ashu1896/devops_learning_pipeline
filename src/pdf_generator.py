import os
import re
from pathlib import Path
from fpdf import FPDF
from src.utils import logger, get_clean_topic_name

class DevOpsPDF(FPDF):
    def __init__(self, topic_name: str, pptx_relative_link: str):
        super().__init__()
        self.topic_name = topic_name
        self.pptx_relative_link = pptx_relative_link
        self.set_margins(20, 20, 20)
        self.alias_nb_pages()
        
    def header(self):
        # Header banner (only print on content pages, skip cover page)
        if self.page_no() > 1:
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(79, 70, 229) # Indigo accent
            self.cell(0, 8, f"DEVOPS EXPERT PIPELINE: {self.topic_name.upper()}", border=0, align="L")
            self.set_text_color(100, 116, 139) # Slate gray
            self.cell(0, 8, "PRODUCTION & SRE GUIDE", border=0, align="R", ln=1)
            # Thin gray division rule
            self.set_draw_color(226, 232, 240)
            self.set_line_width(0.5)
            self.line(20, self.get_y(), 190, self.get_y())
            self.ln(5)

    def footer(self):
        # Footer is printed on all pages
        self.set_y(-18)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.5)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(2)
        
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(148, 163, 184) # Slate light
        # Interactive PPTX relative link
        self.cell(0, 10, "Access Slide Presentation (PPTX)", link=self.pptx_relative_link)
        self.cell(0, 10, f"Page {self.page_no()} of {{nb}}", align="R", ln=1)

    def add_cover_page(self):
        self.add_page()
        # Clean geometric accent blocks
        self.set_fill_color(15, 23, 42) # Slate Dark Background banner
        self.rect(0, 0, 210, 120, "F")
        
        self.set_y(40)
        self.set_font("Helvetica", "B", 26)
        self.set_text_color(255, 255, 255)
        self.multi_cell(0, 12, self.topic_name, align="C")
        
        self.ln(4)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(20, 184, 166) # Teal accent
        self.cell(0, 8, "6-MONTH INDUSTRY MASTERCLASS PATHWAY", align="C", ln=1)
        
        self.set_y(140)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(30, 41, 59) # Dark Slate body
        
        intro_text = (
            "An enterprise-grade, comprehensive technical architecture, deployment workflow, "
            "security hardening guide, and observability plan. Designed for senior engineering "
            "professionals (6+ years experience) striving for Principal SRE and Cloud Architect roles."
        )
        self.multi_cell(0, 8, intro_text, align="C")
        
        self.ln(20)
        self.set_fill_color(248, 250, 252) # Soft gray alert box
        self.rect(20, self.get_y(), 170, 30, "F")
        self.set_draw_color(79, 70, 229) # Left Indigo bar
        self.set_line_width(1.5)
        self.line(20, self.get_y(), 20, self.get_y() + 30)
        
        self.set_y(self.get_y() + 5)
        self.set_x(25)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(79, 70, 229)
        self.cell(0, 5, "CORE CONCEPTS  |  PRODUCTION HARDENING  |  20+ INCIDENT SCENARIOS", ln=1)
        self.set_x(25)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, f"Automated SRE Learn System  |  Generated {Path(__file__).stem.replace('_', ' ').title()}", ln=1)

def sanitize_text(text: str) -> str:
    """
    Sanitizes text to replace unicode characters that are unsupported by basic PDF fonts with safe equivalents.
    """
    replacements = {
        "•": "-",
        "—": "-",
        "–": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "…": "...",
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # Encode and decode back to latin-1, replacing unsupported chars
    return text.encode("latin-1", errors="replace").decode("latin-1")

def compile_to_pdf(topic: str, notes_content: str, interview_content: str, output_path: Path, pptx_relative_link: str):
    """
    Compiles the research notes and interview guides into a beautifully formatted, professional PDF.
    """
    logger.info(f"Compiling PDF for topic '{topic}' using fpdf2...")
    
    # Initialize our custom PDF layout
    pdf = DevOpsPDF(topic, pptx_relative_link)
    pdf.add_cover_page()
    pdf.add_page()
    
    # Simple Markdown Parser
    combined_content = f"{notes_content}\n\n{interview_content}"
    lines = combined_content.split("\n")
    
    in_code_block = False
    code_buffer = []
    
    pdf.set_text_color(30, 41, 59) # Reset default text color
    
    for line in lines:
        line = sanitize_text(line)
        stripped = line.strip()
        
        # Code block tracking
        if stripped.startswith("```"):
            if in_code_block:
                # Flush the code block with special styling
                pdf.set_font("Courier", "", 8.5)
                pdf.set_fill_color(241, 245, 249) # Soft light gray
                pdf.set_text_color(30, 41, 59)
                
                code_text = "\n".join(code_buffer)
                pdf.multi_cell(0, 5, code_text, border=1, fill=True, align="L")
                pdf.ln(4)
                
                in_code_block = False
                code_buffer = []
            else:
                in_code_block = True
            continue
            
        if in_code_block:
            code_buffer.append(line)
            continue
            
        # Parse headings
        if stripped.startswith("# "):
            pdf.ln(6)
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(15, 23, 42) # Slate Dark
            heading = stripped[2:]
            pdf.multi_cell(0, 8, heading)
            # Underline heading
            pdf.set_draw_color(79, 70, 229)
            pdf.set_line_width(1)
            pdf.line(20, pdf.get_y(), 60, pdf.get_y())
            pdf.ln(5)
            
        elif stripped.startswith("## "):
            pdf.ln(5)
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(79, 70, 229) # Indigo primary
            heading = stripped[3:]
            pdf.multi_cell(0, 7, heading)
            pdf.ln(3)
            
        elif stripped.startswith("### "):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(13, 148, 136) # Teal accent
            heading = stripped[4:]
            pdf.multi_cell(0, 6, heading)
            pdf.ln(2)
            
        elif stripped.startswith("#### ") or stripped.startswith("##### "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 9.5)
            pdf.set_text_color(30, 41, 59)
            heading = stripped[stripped.find(" ") + 1:]
            pdf.cell(0, 6, heading, ln=1)
            pdf.ln(2)
            
        elif stripped.startswith("* ") or stripped.startswith("- "):
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(30, 41, 59)
            bullet_text = stripped[2:]
            # Align bullet lists beautifully by shifting left margin temporarily
            pdf.set_left_margin(25)
            pdf.set_x(25)
            pdf.multi_cell(0, 5.5, f"-   {bullet_text}")
            pdf.set_left_margin(20) # Restore default left margin
            pdf.ln(1)
            
        # Parse bold alert blockquotes
        elif stripped.startswith("> [!"):
            # Alert blocks get nice colored border rendering
            alert_type = "NOTE"
            if "WARNING" in stripped or "CAUTION" in stripped:
                alert_type = "WARNING"
            elif "IMPORTANT" in stripped:
                alert_type = "IMPORTANT"
                
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 9)
            if alert_type == "WARNING":
                pdf.set_fill_color(254, 242, 242) # Soft Red
                pdf.set_text_color(220, 38, 38)
            else:
                pdf.set_fill_color(240, 253, 250) # Soft Teal
                pdf.set_text_color(13, 148, 136)
                
            pdf.cell(0, 5, f"--- PRODUCTION {alert_type} ---", ln=1, fill=True)
            
        # Standalone lines / standard paragraphs
        elif stripped:
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(51, 65, 85)
            
            # Clean up inline bold markers (**text**)
            cleaned_line = re.sub(r"\*\*(.*?)\*\*", r"\1", stripped)
            pdf.multi_cell(0, 5.5, cleaned_line)
            pdf.ln(2)
            
        else:
            pdf.ln(2)
            
    # Save the file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))
    logger.info(f"Successfully generated beautiful PDF guide at: {output_path}")
