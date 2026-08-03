from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import logging
from dotenv import load_dotenv

from contextlib import asynccontextmanager

from medical_chatbot_simple import (
    run_medical_rag_stream,
    run_medical_rag,
    run_medical_rag_astream,
    PDF_PATH
)

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# IMPORTANT:
# Do NOT load FAISS/index here.
# Render Free has only 512MB RAM.
# Index will load when first user asks a question.

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Medical Chatbot API started")
    yield
    logger.info("Medical Chatbot API stopped")


app = FastAPI(
    title="Medical Chatbot API",
    version="1.0.0",
    lifespan=lifespan
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models

class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    status: str = "success"


class StreamQueryRequest(BaseModel):
    question: str


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str



# Contact function

def send_email(contact_data: ContactRequest):
    try:
        logger.info("Contact form submission received")
        logger.info(f"Name: {contact_data.name}")
        logger.info(f"Email: {contact_data.email}")
        logger.info(f"Message: {contact_data.message}")

        # Add real email service here later
        return True

    except Exception as e:
        logger.error(str(e))
        return False



# Routes

@app.get("/")
async def root():
    return {
        "message": "🏥 Medical Chatbot API is running!",
        "version": "1.0.0"
    }



@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "medical-chatbot"
    }



@app.get("/info")
async def get_info():
    return {
        "service": "Medical Chatbot",
        "description": "RAG based medical question answering system",
        "knowledge_base": "Medical_book.pdf",
        "model": "LLaMA 3.1 8B",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2"
    }



@app.post("/contact")
async def send_contact_email(request: ContactRequest):

    if (
        not request.name.strip()
        or not request.email.strip()
        or not request.message.strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="All fields are required"
        )

    success = send_email(request)

    if success:
        return {
            "status": "success",
            "message": "Email sent successfully"
        }

    raise HTTPException(
        status_code=500,
        detail="Failed to send email"
    )



@app.post(
    "/ask",
    response_model=QueryResponse
)
async def ask_medical_question(request: QueryRequest):

    try:

        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty"
            )


        logger.info(
            f"Question received: {request.question}"
        )


        # FAISS + embeddings load here only
        answer = run_medical_rag(
            str(PDF_PATH),
            request.question.strip()
        )


        return QueryResponse(
            answer=answer
        )


    except Exception as e:

        logger.error(
            f"Error: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@app.post("/ask-stream")
async def ask_medical_question_stream(
    request: StreamQueryRequest
):

    try:

        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty"
            )


        return StreamingResponse(
            run_medical_rag_astream(
                str(PDF_PATH),
                request.question.strip()
            ),
            media_type="text/plain"
        )


    except Exception as e:

        logger.error(
            f"Streaming error: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



if __name__ == "__main__":

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )