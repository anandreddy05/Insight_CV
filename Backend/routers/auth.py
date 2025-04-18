from typing import Annotated
from datetime import datetime,timedelta,timezone
import os
from pydantic import BaseModel
from jose import jwt,JWTError
from dotenv import load_dotenv
from fastapi import HTTPException,Depends,status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from models import User,UserRole
from database import get_db
from passlib.context import CryptContext

db_dependency = Annotated[Session,Depends(get_db)]

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set. Check your .env file.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10

bcrypt_context = CryptContext(schemes=['bcrypt'],deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(user_id: int, email: str, role: str, expires_delta: timedelta = None):
    encode = {
        'sub': email,
        'id': user_id,
        'role': role  
    }
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(password:str,hashed_password:str) -> bool:
    return bcrypt_context.verify(password,hashed_password)

async def get_current_user(token:Annotated[str,Depends(oauth2_bearer)],db:db_dependency):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

def role(required_role:UserRole,user:User = Depends(get_current_user)):
    if user.role != required_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return user


def authenticate_user(email:str,password:str,db:db_dependency):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User Not Found Please Register")
    elif verify_password(password,user.hashed_password) == False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect Password")
    return user
    
# Role-based access control
def role_required(required_role: UserRole):
    def role_dependency(current_user: Annotated[User, Depends(get_current_user)]):
        if not current_user or not hasattr(current_user, "role"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user or missing role")

        if current_user.role != required_role:  
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return current_user
    return role_dependency


