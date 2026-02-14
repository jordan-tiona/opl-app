import os

import httpx

RECAPTCHA_SECRET_KEY = os.environ.get("RECAPTCHA_SECRET_KEY", "")
VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
SCORE_THRESHOLD = 0.5


async def verify_recaptcha(token: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            VERIFY_URL,
            data={"secret": RECAPTCHA_SECRET_KEY, "response": token},
        )
    result = response.json()
    return result.get("success", False) and result.get("score", 0) >= SCORE_THRESHOLD
