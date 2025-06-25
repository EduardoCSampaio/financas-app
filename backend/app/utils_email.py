import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
MAIL_FROM = os.environ.get("MAIL_FROM")
MAIL_SERVER = os.environ.get("MAIL_SERVER")
MAIL_PORT = int(os.environ.get("MAIL_PORT", 2525))

def send_reset_email(email_to: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email_to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, email_to, msg.as_string()) 