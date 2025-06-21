import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_inactivity_email(name, email):
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    from_email = os.environ.get('FROM_EMAIL', smtp_user)

    subject = 'We Miss You on Codeforces!'
    html = f'''
    <html>
    <body>
        <p>Hi {name},</p>
        <p>We noticed you haven't solved any problems on Codeforces in over a week.<br>
        Keep up your practice and continue your progress!</p>
        <p>Best regards,<br>Student Progress Management System</p>
    </body>
    </html>
    '''

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = email
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, email, msg.as_string())
        return True
    except Exception as e:
        print(f'Failed to send email to {email}: {e}')
        return False 