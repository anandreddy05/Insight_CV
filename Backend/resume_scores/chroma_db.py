from langchain_chroma import Chroma
from langchain.schema import Document
from  langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException,status
from typing import Annotated
from database import get_db, SessionLocal
from models import Resume
import os
from dotenv import load_dotenv


load_dotenv()

HF_API = os.getenv("HUGGINGFACE_API_KEY")

embedding_model = HuggingFaceEmbeddings(model_name="intfloat/e5-base-v2",
                              model_kwargs={'device': 'cuda'},
                              encode_kwargs={'normalize_embeddings': True})

vector_store = Chroma(
                      embedding_function=embedding_model,
                      persist_directory="chroma_db",
                      collection_name="resume_embeddings"  
                    )

db_dependency = Annotated[Session, Depends(get_db)]

def merge_all(resume_obj) -> Document:
    # Convert ORM object to dict if needed
    if hasattr(resume_obj, '__dict__'):
        resume = resume_obj.__dict__.copy()
    else:
        resume = resume_obj

    resume_text = []

    skills = ", ".join(resume.get("skills", []))
    resume_text.append(f"Skills: {skills}")

    project_lines = []
    for proj in resume.get("projects", []):
        project_name = proj.get("project_name", "")
        description = proj.get("description", "")
        tech_stack = ", ".join(proj.get("tech_stack", []))
        project_lines.append(f"{project_name}:\n{description}\nTech Stack: {tech_stack}")
    if project_lines:
        resume_text.append("Projects:\n" + "\n\n".join(project_lines))

    edu_lines = []
    for edu in resume.get("education", []):
        degree = edu.get("degree", "")
        institution = edu.get("institution", "")
        years = edu.get("years", "")
        cgpa = edu.get("cgpa", "")
        edu_lines.append(f"{degree} at {institution}\nYears: {years}\nCGPA: {cgpa}")
    if edu_lines:
        resume_text.append("Education:\n" + "\n\n".join(edu_lines))

    exp_lines = []
    for exp in resume.get("experience", []):
        position = exp.get("position", "")
        company = exp.get("company", "")
        description = exp.get("description", "")
        exp_lines.append(f"{position} at {company}\n{description}")
    if exp_lines:
        resume_text.append("Experience:\n" + "\n\n".join(exp_lines))

    final_text = "\n".join(resume_text).strip()

    if not final_text:
        return None

    return Document(
        page_content=final_text,
        metadata={
            "user_id": resume.get("user_id"),
            "resume_id": resume.get("id")
        }
    )



def store_embeddings(resume_obj):
    if isinstance(resume_obj, Resume):
        resume = resume_obj.__dict__.copy()
    else:
        resume = resume_obj

    resume = {k: v for k, v in resume.items() if not k.startswith('_')}

    doc = merge_all(resume)

    if not doc.page_content.strip():
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail="Empty or invalid resume content."
        )

    resume_id = resume.get("id")
    if not resume_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume ID is missing"
        )

    doc_id = f"resume_{resume_id}"
    vector_store.add_documents([doc], ids=[doc_id])
    if hasattr(vector_store,"persist"):
      vector_store.persist()

    return {"status": "success"}



def delete_embedding(resume_id: int):
    doc_id = f"resume_{resume_id}"
    vector_store.delete(ids=[doc_id])

    # Only persist if persist_directory is set
    if hasattr(vector_store, "persist"):
        vector_store.persist()
        

