from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from email_service import send_email
from recaptcha import verify_recaptcha

router = APIRouter(prefix="/contact", tags=["contact"])

VALID_REASONS = {"Bug Report", "Issue with My Account", "Issue Concerning CSOPL", "General Question", "Other"}


class ContactRequest(BaseModel):
    reason: str
    message: str
    recaptcha_token: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if v not in VALID_REASONS:
            raise ValueError(f"Invalid reason: {v}")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v


@router.post("/")
async def submit_contact(data: ContactRequest):
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")

    body = f"""# New Contact Form Submission

- **Reason:** {data.reason}
- **Message:** {data.message}
"""
    await send_email(["support@csopl.com"], f"Contact Form - {data.reason}", body)
    return {"message": "Your message has been sent successfully."}
