from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from transformers import pipeline
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Career Predictor API",
    description="AI-powered career prediction service",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the pipeline
career_pipeline = None

# Input data format with validation
class Query(BaseModel):
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

# Response model
class PredictionResponse(BaseModel):
    query: str
    label: str
    confidence: float
    success: bool
    message: str

# Load model on startup
@app.on_event("startup")
async def load_model():
    global career_pipeline
    try:
        model_path = "./career_prediction_model"
        
        # Check if model exists
        if not os.path.exists(model_path):
            logger.error(f"Model path {model_path} does not exist")
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        logger.info("Loading career prediction model...")
        career_pipeline = pipeline(
            "text-classification", 
            model=model_path, 
            tokenizer=model_path,
            return_all_scores=False  # Only return top prediction
        )
        logger.info("Model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        # In production, you might want to exit here
        # raise e

@app.get("/")
def read_root():
    return {
        "message": "Career Predictor API is running",
        "status": "healthy",
        "model_loaded": career_pipeline is not None
    }

@app.get("/health")
def health_check():
    """Health check endpoint for Docker/Kubernetes"""
    return {
        "status": "healthy" if career_pipeline is not None else "unhealthy",
        "model_loaded": career_pipeline is not None
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(query: Query):
    """Predict career based on input text"""
    
    # Check if model is loaded
    if career_pipeline is None:
        logger.error("Model not loaded")
        raise HTTPException(
            status_code=503, 
            detail="Model service unavailable. Please try again later."
        )
    
    try:
        logger.info(f"Processing prediction for text length: {len(query.text)}")
        
        # Get prediction from pipeline
        result = career_pipeline(query.text)
        
        # Handle different result formats
        if isinstance(result, list) and len(result) > 0:
            prediction = result[0]
        elif isinstance(result, dict):
            prediction = result
        else:
            raise ValueError("Unexpected prediction format")
        
        # Validate prediction structure
        if 'label' not in prediction or 'score' not in prediction:
            raise ValueError("Invalid prediction format: missing label or score")
        
        confidence = round(float(prediction['score']), 4)
        
        logger.info(f"Prediction successful: {prediction['label']} ({confidence})")
        
        return PredictionResponse(
            query=query.text,
            label=prediction['label'],
            confidence=confidence,
            success=True,
            message="Prediction completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

# Optional: Add endpoint to get model info
@app.get("/model/info")
def get_model_info():
    """Get information about the loaded model"""
    if career_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_loaded": True,
        "model_path": "./career_prediction_model",
        "task": "text-classification",
        "framework": "transformers"
    }