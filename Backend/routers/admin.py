from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db
from models import User, UserRole,Resume
from .auth import  get_current_user
from .login import role_required
from resume_scores.chroma_db import delete_embedding

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[User, Depends(get_current_user)]

@router.get("/all-users", dependencies=[Depends(role_required(UserRole.admin))])
async def admin_read_all_users(db: db_dependency):
    users = db.query(User).all()
    return users

@router.get("/{user_id}", dependencies=[Depends(role_required(UserRole.admin))])
async def admin_read_users_by_id(user_id: int, db: db_dependency):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.delete("/{user_id}",dependencies=[Depends(role_required(UserRole.admin))])
async def admin_delete_users_by_id(user_id:int,db:db_dependency):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="user id not found")
    db.delete(user)
    db.commit()
    return "Successfully Deleleted"

# Resumes
@router.get("/resumes/",dependencies=[Depends(role_required(UserRole.admin))])
async def admin_read_all_resumes(db:db_dependency):
    resume_model = db.query(Resume).all()
    return resume_model

@router.get("/resumes/{user_id}",dependencies=[Depends(role_required(UserRole.admin))])
async def admin_read_resumes_by_id(user_id:int,db:db_dependency,user:user_dependency):
    resume_model = db.query(Resume).filter(Resume.user_id == user_id).first()
    if not resume_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No Resume found")
    return resume_model

@router.delete("/resumes/{resume_id}",dependencies=[Depends(role_required(UserRole.admin))])
async def admin_delete_resume(db:db_dependency,user:user_dependency,resume_id: int):
    resume_model = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No Resume found")
    db.delete(resume_model)
    db.commit()
    delete_embedding(resume_id)
    return "Deleted Successfully"
#anand@gmail.com
#test@1234!

