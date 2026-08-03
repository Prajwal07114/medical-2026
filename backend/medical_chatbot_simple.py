# ================== imports ==================

import os
import json
import hashlib
import sys
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


# ================== logging ==================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)



# ================== ENV ==================

load_dotenv()


BASE_DIR = Path(__file__).parent

PDF_PATH = BASE_DIR / "Medical_book.pdf"

INDEX_ROOT = BASE_DIR / ".indices"

INDEX_ROOT.mkdir(
    exist_ok=True
)



# ================== CACHE ==================

_EMBEDDINGS_CACHE = {}

_VECTORSTORE_CACHE = None

_CHAIN_CACHE = None



# ================== PDF ==================

def load_pdf(path):

    logger.info("Loading PDF...")

    return PyPDFLoader(
        str(path)
    ).load()



# ================== CHUNKING ==================

def split_documents(
        docs,
        chunk_size=800,
        chunk_overlap=100
):

    splitter = RecursiveCharacterTextSplitter(

        chunk_size=chunk_size,

        chunk_overlap=chunk_overlap

    )

    return splitter.split_documents(docs)



# ================== EMBEDDINGS ==================

def get_embeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
):

    if model_name not in _EMBEDDINGS_CACHE:


        logger.info(
            f"Loading embedding model {model_name}"
        )


        _EMBEDDINGS_CACHE[model_name] = HuggingFaceEmbeddings(

            model_name=model_name,


            model_kwargs={
                "device":"cpu"
            },


            encode_kwargs={

                "batch_size":16,

                "normalize_embeddings":True

            }

        )


    return _EMBEDDINGS_CACHE[model_name]




# ================== FAISS BUILD ==================

def build_vectorstore(
        splits,
        embed_model_name
):


    embeddings = get_embeddings(
        embed_model_name
    )


    logger.info(
        "Creating FAISS index..."
    )


    vectorstore = FAISS.from_documents(

        splits,

        embeddings

    )


    return vectorstore




# ================== HASH ==================

def file_fingerprint(path):

    p = Path(path)

    h = hashlib.sha256()


    with p.open("rb") as f:

        for chunk in iter(
            lambda:f.read(1024*1024),
            b""
        ):

            h.update(chunk)



    return {

        "sha256":h.hexdigest(),

        "size":p.stat().st_size,

        "mtime":int(p.stat().st_mtime)

    }





def index_key(
        pdf_path,
        chunk_size,
        chunk_overlap,
        embed_model
):


    data={

        "pdf":file_fingerprint(pdf_path),

        "chunk_size":chunk_size,

        "chunk_overlap":chunk_overlap,

        "embedding":embed_model

    }


    return hashlib.sha256(

        json.dumps(
            data,
            sort_keys=True
        ).encode()

    ).hexdigest()




# ================== LOAD INDEX ==================

def load_index(
        index_dir,
        embed_model_name
):


    embeddings=get_embeddings(
        embed_model_name
    )


    return FAISS.load_local(

        str(index_dir),

        embeddings,

        allow_dangerous_deserialization=True

    )



# ================== BUILD INDEX ==================

def build_index(

        pdf_path,

        index_dir,

        chunk_size,

        chunk_overlap,

        embed_model

):


    docs=load_pdf(
        pdf_path
    )


    logger.info(
        f"Pages loaded: {len(docs)}"
    )



    splits=split_documents(

        docs,

        chunk_size,

        chunk_overlap

    )


    logger.info(
        f"Chunks created: {len(splits)}"
    )


    vs=build_vectorstore(

        splits,

        embed_model

    )


    index_dir.mkdir(

        parents=True,

        exist_ok=True

    )


    vs.save_local(

        str(index_dir)

    )


    return vs

# ================== LOAD OR BUILD INDEX ==================

def load_or_build_index(
        pdf_path,
        chunk_size=800,
        chunk_overlap=100,
        embed_model_name="sentence-transformers/all-MiniLM-L6-v2",
        force_rebuild=False
):

    global _VECTORSTORE_CACHE


    if _VECTORSTORE_CACHE is not None and not force_rebuild:

        logger.info(
            "Using cached FAISS vectorstore"
        )

        return _VECTORSTORE_CACHE



    key = index_key(

        pdf_path,

        chunk_size,

        chunk_overlap,

        embed_model_name

    )


    index_dir = INDEX_ROOT / key



    faiss_file = index_dir / "index.faiss"

    pkl_file = index_dir / "index.pkl"



    if (
        not force_rebuild
        and faiss_file.exists()
        and pkl_file.exists()
    ):


        logger.info(
            "Loading existing FAISS index..."
        )


        _VECTORSTORE_CACHE = load_index(

            index_dir,

            embed_model_name

        )


        return _VECTORSTORE_CACHE



    logger.info(
        "Building new FAISS index..."
    )


    _VECTORSTORE_CACHE = build_index(

        pdf_path,

        index_dir,

        chunk_size,

        chunk_overlap,

        embed_model_name

    )


    return _VECTORSTORE_CACHE





# ================== LLM ==================

llm = ChatGroq(

    model_name="llama-3.1-8b-instant",

    temperature=0,

    max_tokens=300

)




# ================== PROMPT ==================

prompt = ChatPromptTemplate.from_messages(

[

(

"system",

"""
You are a medical assistant.

Rules:

1. Answer only medical questions.
2. Use provided context first.
3. Keep answers concise.
4. Do not create false information.

If information is unavailable say:
"I do not have sufficient information."

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

]

)




# ================== CONTEXT FORMAT ==================

def format_docs(docs):

    return "\n\n".join(

        doc.page_content[:1200]

        for doc in docs

    )





# ================== CHAIN CACHE ==================

def get_chain(vectorstore):

    global _CHAIN_CACHE



    if _CHAIN_CACHE is not None:

        return _CHAIN_CACHE




    logger.info(
        "Creating RAG chain..."
    )



    retriever = vectorstore.as_retriever(

        search_type="similarity",

        search_kwargs={

            "k":3

        }

    )



    _CHAIN_CACHE = (

        RunnableParallel(

            {

            "context":

                retriever

                |

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






# ================== NORMAL RESPONSE ==================

def run_medical_rag(
        pdf_path,
        question
):

    try:


        vectorstore = load_or_build_index(

            pdf_path

        )


        chain = get_chain(

            vectorstore

        )


        logger.info(
            "Generating response..."
        )


        answer = chain.invoke(

            question

        )


        return answer



    except Exception as e:


        logger.error(
            f"RAG Error: {e}"
        )


        return str(e)






# ================== STREAM RESPONSE ==================

def run_medical_rag_stream(
        pdf_path,
        question
):

    try:


        vectorstore = load_or_build_index(

            pdf_path

        )


        chain=get_chain(

            vectorstore

        )



        response=""



        for chunk in chain.stream(question):


            response += chunk


            sys.stdout.write(chunk)

            sys.stdout.flush()



        return response



    except Exception as e:


        logger.error(
            f"Streaming error: {e}"
        )


        return str(e)







# ================== ASYNC STREAM ==================

async def run_medical_rag_astream(

        pdf_path,

        question

):

    try:


        vectorstore = load_or_build_index(

            pdf_path

        )


        chain=get_chain(

            vectorstore

        )



        async for chunk in chain.astream(question):


            yield chunk




    except Exception as e:


        yield str(e)







# ================== CLI TEST ==================

if __name__ == "__main__":


    print(
        "🏥 Medical Chatbot Ready"
    )


    print(
        "="*50
    )


    try:


        # Load once

        load_or_build_index(

            PDF_PATH

        )


        print(
            "✅ Knowledge base loaded"
        )



    except Exception as e:


        print(
            "Index error:",
            e
        )

        exit()



    while True:


        try:


            q=input(
                "\nQuestion: "
            ).strip()



            if not q:

                continue



            print(
                "\nAnswer:\n"
            )


            run_medical_rag_stream(

                PDF_PATH,

                q

            )


            print(
                "\n\n"+"="*50
            )



        except KeyboardInterrupt:


            print(
                "\nBye"
            )

            break