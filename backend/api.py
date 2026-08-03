import os
import sys
import json
import hashlib
import logging
from pathlib import Path
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import (
    RunnableParallel,
    RunnablePassthrough,
    RunnableLambda,
)
from langchain_core.output_parsers import StrOutputParser


# ================= LOGGING =================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ================= ENV =================

load_dotenv()


BASE_DIR = Path(__file__).parent

PDF_PATH = BASE_DIR / "Medical_book.pdf"

INDEX_ROOT = BASE_DIR / ".indices"
INDEX_ROOT.mkdir(exist_ok=True)


# ================= GLOBAL CACHE =================

_EMBEDDINGS_CACHE = None
_VECTORSTORE_CACHE = None
_RETRIEVER_CACHE = None
_CHAIN_CACHE = None



# ================= PDF =================


def load_pdf(path):

    logger.info("Loading PDF")

    loader = PyPDFLoader(str(path))

    return loader.load()



def split_documents(
        docs,
        chunk_size=700,
        chunk_overlap=100
):

    splitter = RecursiveCharacterTextSplitter(

        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap

    )

    return splitter.split_documents(docs)



# ================= EMBEDDING =================


def get_embeddings():


    global _EMBEDDINGS_CACHE


    if _EMBEDDINGS_CACHE is None:

        logger.info(
            "Loading embedding model..."
        )


        _EMBEDDINGS_CACHE = HuggingFaceEmbeddings(

            model_name=
            "sentence-transformers/all-MiniLM-L6-v2",

            model_kwargs={
                "device":"cpu"
            },

            encode_kwargs={
                "normalize_embeddings":True
            }

        )


    return _EMBEDDINGS_CACHE




# ================= INDEX =================


def get_index_path():

    return INDEX_ROOT / "medical_faiss"



def build_index():


    logger.info("Building FAISS index")


    docs = load_pdf(PDF_PATH)


    logger.info(
        f"Pages: {len(docs)}"
    )


    chunks = split_documents(docs)


    logger.info(
        f"Chunks: {len(chunks)}"
    )


    embeddings = get_embeddings()


    vectorstore = FAISS.from_documents(
        chunks,
        embeddings
    )


    path = get_index_path()

    path.mkdir(
        parents=True,
        exist_ok=True
    )


    vectorstore.save_local(
        str(path)
    )


    return vectorstore




def load_vectorstore():


    global _VECTORSTORE_CACHE


    if _VECTORSTORE_CACHE:

        return _VECTORSTORE_CACHE



    embeddings = get_embeddings()


    path = get_index_path()



    if (
        (path/"index.faiss").exists()
        and
        (path/"index.pkl").exists()
    ):


        logger.info(
            "Loading existing FAISS index"
        )


        _VECTORSTORE_CACHE = (
            FAISS.load_local(
                str(path),
                embeddings,
                allow_dangerous_deserialization=True
            )
        )


    else:

        _VECTORSTORE_CACHE = build_index()



    return _VECTORSTORE_CACHE



# ================= RETRIEVER =================


def get_retriever():


    global _RETRIEVER_CACHE


    if _RETRIEVER_CACHE is None:


        logger.info(
            "Creating retriever"
        )


        vectorstore = load_vectorstore()



        _RETRIEVER_CACHE = (
            vectorstore.as_retriever(

                search_type="similarity",

                search_kwargs={
                    "k":2
                }

            )
        )


    return _RETRIEVER_CACHE



# ================= LLM =================


llm = ChatGroq(

    model_name="llama-3.1-8b-instant",

    temperature=0,

    max_tokens=500

)



# ================= PROMPT =================


prompt = ChatPromptTemplate.from_messages([


(
"system",

"""
You are a medical assistant.

Rules:
- Answer only medical questions.
- Use given context.
- Do not invent facts.
- Keep answers short.

Format:

### Answer

### Details

### Important Notes

### Source
"""
),


(
"human",

"""
Question:

{question}


Context:

{context}

"""
)

])




def format_docs(docs):

    return "\n\n".join(

        doc.page_content

        for doc in docs

    )





# ================= CHAIN =================


def get_chain():


    global _CHAIN_CACHE


    if _CHAIN_CACHE is None:


        logger.info(
            "Creating RAG chain"
        )


        retriever = get_retriever()



        _CHAIN_CACHE = (

            RunnableParallel(

                {

                "context":
                retriever |
                RunnableLambda(format_docs),


                "question":
                RunnablePassthrough()

                }

            )

            |

            prompt

            |

            llm

            |

            StrOutputParser()

        )



    return _CHAIN_CACHE





# ================= API FUNCTIONS =================



def run_medical_rag(
        pdf_path,
        question
):


    try:


        chain = get_chain()


        return chain.invoke(
            question
        )


    except Exception as e:


        logger.error(
            str(e)
        )


        return (
            "Error processing request"
        )





async def run_medical_rag_astream(
        pdf_path,
        question
):


    try:


        chain = get_chain()



        async for chunk in chain.astream(
            question
        ):

            yield chunk



    except Exception as e:


        logger.error(
            str(e)
        )


        yield (
            "Error processing request"
        )





# ================= LOCAL TEST =================


if __name__=="__main__":


    print(
        "Medical chatbot started"
    )


    while True:


        q=input(
            "\nQuestion: "
        )


        if q:


            print(
                run_medical_rag(
                    PDF_PATH,
                    q
                )
            )