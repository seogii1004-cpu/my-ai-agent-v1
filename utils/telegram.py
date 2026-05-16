import os
import requests


TELEGRAM_TOKEN = os.environ[TELEGRAM_BOT_TOKEN]
TELEGRAM_CHAT_ID = os.environ[TELEGRAM_CHAT_ID]


def send_message(text: str) -> bool:
    url = fhttps://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage
    payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: Markdown,
    }
    resp = requests.post(url, json=payload, timeout=10)
    return resp.ok
