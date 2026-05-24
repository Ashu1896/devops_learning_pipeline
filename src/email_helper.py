import smtplib
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from src.config import (
    SMTP_SERVER,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    EMAIL_TO
)
from src.utils import logger

def send_email_notification(topic: str, part: int, pdf_path: Path, pptx_path: Path, completion_pct: float):
    """
    Sends an automated, professionally styled HTML email with the compiled PDF and PPTX files attached.
    Degrades gracefully with log warnings if credentials are missing or SMTP fails.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("SMTP username/password not configured in environment. Skipping email delivery.")
        return
        
    logger.info(f"Initiating automated email delivery to: {EMAIL_TO}...")
    
    # Create the root message container
    msg = MIMEMultipart()
    msg["From"] = SMTP_USERNAME
    msg["To"] = EMAIL_TO
    msg["Subject"] = f"[DevOps Study Guide] {topic} - Part {part}/3"
    
    # Clean modern HTML Email Body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #4f46e5;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">
              DEVOPS MASTERCLASS SERIES
            </h1>
            <p style="color: #20b8a6; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              Automated Study Guide & SRE Blueprint Delivery
            </p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 24px; line-height: 1.6;">
            <h2 style="color: #4f46e5; margin-top: 0; font-size: 18px;">
              Your Study Materials are Ready: {topic} (Part {part})
            </h2>
            <p style="font-size: 14px; margin-bottom: 20px;">
              Hello, your automated learning pipeline has successfully executed its scheduled run. 
              The deep-technical study manual and companion widescreen presentation slides are attached below.
            </p>
            
            <!-- Dashboard Metrics Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left; font-weight: bold;">
                  <th style="padding: 10px; border: 1px solid #e2e8f0;">Metric Type</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0;">Current Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Active Topic</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #4f46e5; font-weight: bold;">{topic}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Active Part Progress</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">Part {part} of 3 (Q{1 if part==1 else (21 if part==2 else 41)}-{20 if part==1 else (40 if part==2 else 50)})</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Roadmap Completion</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #14b8a6; font-weight: bold;">{completion_pct}%</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Action callout box -->
            <div style="background-color: #f8fafc; border-left: 4px solid #14b8a6; padding: 14px; border-radius: 0 4px 4px 0; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; font-style: italic; color: #475569;">
                <strong>Next Step:</strong> Review the attached presentation for system architectures, then read the PDF textbook guide to go through the comprehensive conceptual analysis and SRE interview questions.
              </p>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
              This is an automated system email. To stop or reschedule, adjust your GitHub Actions cron timing.
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, "html"))
    
    # Helper to attach binary documents
    def attach_file(file_path: Path, mime_type: str, mime_subtype: str):
        if not file_path.exists():
            logger.error(f"Cannot attach missing file: {file_path}")
            return
            
        with open(file_path, "rb") as attachment:
            part = MIMEBase(mime_type, mime_subtype)
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {file_path.name}",
            )
            msg.attach(part)
            
    # Attach PDF & PPTX
    attach_file(pdf_path, "application", "pdf")
    attach_file(pptx_path, "application", "vnd.openxmlformats-officedocument.presentationml.presentation")
    
    # Establish TLS connection and transmit
    try:
        logger.info(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}...")
        smtp = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20)
        smtp.starttls()
        
        logger.info("Performing SMTP login authentication...")
        smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        logger.info("Transmitting email payload...")
        smtp.sendmail(SMTP_USERNAME, EMAIL_TO, msg.as_string())
        smtp.quit()
        
        logger.info("Successfully delivered study guides to your mailbox.")
    except Exception as e:
        logger.error(f"Failed to deliver email: {e}. Moving forward to prevent pipeline execution crashes.")
