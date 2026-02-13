from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator

from email_service import send_email
from recaptcha import verify_recaptcha

router = APIRouter(prefix="/join", tags=["join"])

VALID_NIGHTS = {"Tuesday", "Wednesday", "Thursday"}


class JoinRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    nights: list[str]
    recaptcha_token: str

    @field_validator("nights")
    @classmethod
    def validate_nights(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one night must be selected")
        invalid = set(v) - VALID_NIGHTS
        if invalid:
            raise ValueError(f"Invalid nights: {invalid}")
        return v


@router.post("/")
async def submit_join_request(data: JoinRequest):
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")

    body = f"""# New CSOPL Join Request

- **Name:** {data.name}
- **Google Email:** {data.email}
- **Phone:** {data.phone}
- **Preferred Nights:** {', '.join(data.nights)}
"""
    await send_email(["joincsopl@csopl.com"], "New Join Request - CSOPL", body)
    return {"message": "Your request has been submitted successfully."}
