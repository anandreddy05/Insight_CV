from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends, status
from database import Base, engine, get_db
from models import User, UserRole
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from .auth import create_access_token, authenticate_user, get_current_user,role_required
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

Base.metadata.create_all(bind=engine)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
user_dependency = Annotated[dict,Depends(get_current_user)]

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Schema for Registration
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    role: UserRole = UserRole.user  

# Schema for Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(db: db_dependency, user_data: UserCreate):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='Email already registered')

    # Create new user with hashed password
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        hashed_password=bcrypt_context.hash(user_data.password),
        role=user_data.role  
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "role": new_user.role.value 
    }

@router.post("/login")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: db_dependency
):
    user = authenticate_user(form_data.username, form_data.password, db)    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials") 

    access_token = create_access_token(
    user_id=user.id,
    email=user.email,
    role=user.role,
    expires_delta=timedelta(minutes=20)
)

    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/change-password")
def change_password(
    db: db_dependency,
    current_user: user_dependency,
    new_password: str
):
    user_model = db.query(User).filter(User.id == current_user.id).first()
    if not user_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if bcrypt_context.verify(new_password, user_model.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the old password")

    user_model.hashed_password = bcrypt_context.hash(new_password)
    db.commit()
    db.refresh(user_model)

    return {"message": "Password updated successfully"}

