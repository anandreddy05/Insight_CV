from fastapi import APIRouter, Depends, HTTPException,status
from typing import Annotated
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import SimpleJsonOutputParser
import os
from database import get_db
from models import Resume, UserRole
from .auth import role_required
from pydantic import BaseModel
from resume_scores.chroma_db import merge_all,vector_store

load_dotenv()

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])

db_dependency = Annotated[Session, Depends(get_db)]

groq_api = os.getenv("GROQ_API_KEY")

model = ChatGroq(
    api_key=groq_api,
    model="llama3-8b-8192",
    temperature=0.3
)

prompt = PromptTemplate(
    template="""
Compare the following job description and resume.

Job Description:
{job_description}

Resume:
{resume_text}

Tasks:
1. Review the resume in context of the job description.
2. Score based on:
    a. Projects (50 pts) — uniqueness and technical difficulty.
    b. Experience (30 pts) — relevance and depth.
    c. CGPA (20 pts) — only consider if resumes are similarly strong.

3. Return only a valid, strict JSON object with the fields:
    - match_score (int)
    - summary (str)
    - file_path (same as {resume_file_path})

 DO NOT include any commentary, explanation, or markdown.
 JUST return the JSON object. No breakdown or extra text.
 4. Return Only those resumes which are matching with the job description. If they do not match return No Resume Found.
 5. If there are some lacking skills or experience for the given job description say **No Resume Found** in summary.

Example:
{{
    "match_score": 85,
    "summary": "Strong technical projects aligned with the role. Great match overall.",
    "file_path": "{resume_file_path}"
}}
""",
    input_variables=["job_description", "resume_text", "resume_file_path"]
)


parser = SimpleJsonOutputParser()
chain = prompt | model | parser



class BestResumesRequest(BaseModel):
    job_description: str
    threshold: int = 70




def filter_top_resumes_with_chroma(job_desc: str, top_k: int = 100):
    results = vector_store.similarity_search_with_score(job_desc, k=top_k)
    return [doc.metadata["resume_id"] for doc, _ in results]


@router.post("/match-best-resumes", dependencies=[Depends(role_required(UserRole.recruiter))])
async def find_best_resumes(payload: BestResumesRequest, db: db_dependency):
    job_description = payload.job_description

    # Step 1: Filter relevant resumes via vector search
    top_resume_ids = filter_top_resumes_with_chroma(job_description)
    if not top_resume_ids:
        return {"error": "No relevant resumes found using vector similarity."}

    resumes = db.query(Resume).filter(Resume.id.in_(top_resume_ids)).all()
    if not resumes:
        return {"error": "No resumes found in the database."}

    scored_resumes = []

    for resume in resumes:
        doc = merge_all(resume)
        if not doc:
            continue

        try:
            result = chain.invoke({
                "job_description": job_description,
                "resume_text": doc.page_content,
                "resume_file_path": resume.file_path
            })

            score = result.get("match_score", 0)

            if score >= payload.threshold and "No Resume Found" not in result.get("summary", "").lower():
                scored_resumes.append({
                    "resume":resume,
                    "match_score": score,
                    "summary": result.get("summary", "")
                })

        except Exception as e:
            print(f"Error scoring resume id {resume.id}: {e}")
            continue

    if not scored_resumes:
        return {"error": "No resumes matched the job description well enough."}

    scored_resumes  = sorted(scored_resumes, key=lambda r: r["match_score"], reverse=True)
    best_score = scored_resumes[0]["match_score"]

    return {
        "top_resumes": [
            {
                "resume_data": {
                    "user_id": r["resume"].user_id,
                    "resume_id": r["resume"].id,
                    "file_path": r["resume"].file_path,
                    "extracted_text": r["resume"].extracted_text,
                    "skills": r["resume"].skills,
                    "experience": r["resume"].experience,
                    "projects": r["resume"].projects,
                    "education": r["resume"].education
                },
                "match_score": r["match_score"],
                "summary": r["summary"]
            }
            for r in scored_resumes
        ],
        "best_match_score": best_score
    }

