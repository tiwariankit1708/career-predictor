from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import requests
import os
from typing import Optional
import logging
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables - NEVER hardcode API keys!
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Removed hardcoded key
MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://model_service:8000")

app = FastAPI(
    title="Career Predictor Backend",
    version="1.0"
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a session with retry strategy for better reliability
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)
session.mount("https://", adapter)

# Request models with validation
class CareerRequest(BaseModel):
    text: str
    
    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        if len(v.strip()) < 10:
            raise ValueError('Text must be at least 10 characters long')
        if len(v) > 1000:
            raise ValueError('Text must be less than 1000 characters')
        return v.strip()

class UserQuestion(BaseModel):
    question: str
    context: Optional[str] = None
    
    @validator('question')
    def validate_question(cls, v):
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        if len(v.strip()) < 10:
            raise ValueError('Question must be at least 10 characters long')
        if len(v) > 1000:
            raise ValueError('Question must be less than 1000 characters')
        return v.strip()

@app.get("/ping")
def ping():
    return {"message": "Backend is alive!"}

@app.get("/health")
def health_check():
    """Check if both orchestrator and model service are healthy"""
    try:
        # Test model service connection
        model_resp = session.get(f"{MODEL_SERVICE_URL}/health", timeout=5)
        model_healthy = model_resp.status_code == 200
        
        return {
            "orchestrator": "healthy",
            "model_service": "healthy" if model_healthy else "unhealthy",
            "model_service_url": MODEL_SERVICE_URL,
            "gemini_configured": bool(GEMINI_API_KEY)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "orchestrator": "healthy",
            "model_service": "unhealthy",
            "model_service_url": MODEL_SERVICE_URL,
            "error": str(e)
        }

def polish_with_gemini(label: str, confidence: float, user_text: str, is_question: bool = False) -> str:
    """
    Enhanced Gemini polishing with better error handling and security
    """
    # Check if Gemini is configured
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not configured")
        fallback = f"Based on your input, I'd recommend exploring {label} as a career path (confidence: {confidence:.1%})."
        return fallback

    # Validate inputs
    if not label or confidence < 0:
        return "I apologize, but I couldn't generate a proper career recommendation at this time."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Career-Predictor/1.0"
    }

    # Sanitize user input for prompt injection prevention
    sanitized_text = user_text.replace('"', "'").replace('\n', ' ')[:500]  # Limit length
    
    # Different prompts for questions vs statements
    if is_question:
        prompt_text = (
            f"You are an expert career counselor. A person asked: '{sanitized_text}' "
            f"Our AI analysis suggests the career field: '{label}' (confidence: {confidence:.1%}). "
            f"Provide a helpful, personalized answer that:\n"
            f"- Directly addresses their question\n"
            f"- Explains why {label} fits their interests/situation\n"
            f"- Gives 2-3 specific, actionable next steps\n"
            f"- Mentions the confidence level naturally\n"
            f"Be conversational and encouraging. Keep response to 3-4 sentences."
        )
    else:
        prompt_text = (
            f"You are a career counselor providing personalized advice. "
            f"A person said: '{sanitized_text}' "
            f"Our AI model suggests the career field: '{label}' (confidence: {confidence:.1%}). "
            f"Write a unique, personalized response (2-3 sentences) that:\n"
            f"- Connects their specific interests/skills to this career path\n"
            f"- Explains what makes this field suitable for them\n"
            f"- Offers encouraging but realistic next steps\n"
            f"Vary your opening - don't always start with 'That's fantastic'. "
            f"Be conversational, specific, and avoid repetitive phrases."
        )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt_text
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 300,
            "topP": 0.9,
            "topK": 40
        },
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH", 
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    }

    try:
        resp = session.post(url, headers=headers, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # Parse the Gemini response structure
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                if len(parts) > 0 and "text" in parts[0]:
                    response_text = parts[0]["text"].strip()
                    # Basic content filtering
                    if len(response_text) > 10:  # Ensure we got a meaningful response
                        return response_text
                
        # Fallback if structure is unexpected
        logger.warning(f"Unexpected Gemini response structure: {data}")
        return f"Based on your input, I'd recommend exploring {label} as a career path (confidence: {confidence:.1%})."

    except requests.exceptions.Timeout:
        logger.error("Gemini API timeout")
        return f"I'd recommend exploring {label} as a career option (confidence: {confidence:.1%}). Gemini processing is currently slow."
    except requests.exceptions.RequestException as e:
        logger.error(f"Gemini API request error: {e}")
        return f"Based on your input, the predicted career field is {label} with {confidence:.1%} confidence."
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return f"Based on your input, I'd suggest considering {label} as a career option."

@app.post("/ask-question")
def ask_question(req: UserQuestion):
    """
    Endpoint specifically for user questions - calls model then polishes with Gemini
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing question: {req.question[:100]}...")
        
        # Step 1: Get prediction from model service with retry
        model_resp = session.post(
            f"{MODEL_SERVICE_URL}/predict",
            json={"text": req.question},
            timeout=15
        )
        model_resp.raise_for_status()
        model_data = model_resp.json()

        # Check for model service errors
        if not model_data.get("success", True) or "error" in model_data:
            error_msg = model_data.get("error", "Unknown model error")
            logger.error(f"Model service returned error: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Model analysis failed: {error_msg}")

        # Step 2: Polish with Gemini (specifically for questions)
        polished_response = polish_with_gemini(
            label=model_data.get("label", "Unknown"),
            confidence=model_data.get("confidence", 0.0),
            user_text=req.question,
            is_question=True
        )

        processing_time = time.time() - start_time
        
        return {
            "original_input": req.question,
            "prediction": {
                "label": model_data.get("label"),
                "confidence": model_data.get("confidence")
            },
            "polished_response": polished_response,
            "processing_time": round(processing_time, 2),
            "context": req.context,
            "success": True
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Model service error: {e}")
        raise HTTPException(
            status_code=503, 
            detail="Career analysis service is currently unavailable. Please try again in a moment."
        )
    except Exception as e:
        logger.error(f"Internal error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred while processing your question. Please try again."
        )

@app.post("/predict-career")
def predict_career(req: CareerRequest):
    """
    Original endpoint - improved with better error handling
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing career prediction for text length: {len(req.text)}")
        
        # Step 1: Get prediction from model service
        model_resp = session.post(
            f"{MODEL_SERVICE_URL}/predict",
            json={"text": req.text},
            timeout=15
        )
        model_resp.raise_for_status()
        model_data = model_resp.json()

        # Check for errors in model response
        if not model_data.get("success", True) or "error" in model_data:
            error_msg = model_data.get("error", "Unknown model error")
            raise HTTPException(status_code=500, detail=f"Model analysis failed: {error_msg}")

        # Step 2: Polish the response using Gemini
        if "label" in model_data:
            polished = polish_with_gemini(
                label=model_data["label"], 
                confidence=model_data.get("confidence", 0.0),
                user_text=req.text,
                is_question=False
            )
            model_data["polished_response"] = polished
        
        # Add processing time
        processing_time = time.time() - start_time
        model_data["processing_time"] = round(processing_time, 2)
        model_data["success"] = True
                
        return model_data

    except requests.exceptions.RequestException as e:
        logger.error(f"Model service error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Career analysis service is currently unavailable. Please try again."
        )
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)