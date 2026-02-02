import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    # LiveKit
    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

    # APIs
    openai_api_key = os.getenv("OPENAI_API_KEY")
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    cartesia_api_key = os.getenv("CARTESIA_API_KEY")
    cartesia_voice_id = os.getenv("CARTESIA_VOICE_ID", "248be419-3632-4f4d-b671-2ab23ede5d4d") # Default ID if not set
    sip_trunk_id = os.getenv("SIP_TRUNK_ID")

    # Redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Twilio (for SMS follow-ups)
    twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Follow-up settings (in minutes)
    followup_delay_warm = int(os.getenv("FOLLOWUP_DELAY_WARM", "2"))  # 2 minutes for testing (change to 60 for production)
    followup_delay_cold = int(os.getenv("FOLLOWUP_DELAY_COLD", "1440"))  # 24 hours for cold leads
    
    # Booking link for SMS
    booking_link = os.getenv("BOOKING_LINK", "https://calendly.com/lumoscale")

settings = Settings()
