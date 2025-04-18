from database import Base
from sqlalchemy import Column, Float, Integer, ForeignKey, String, Text, Enum as SQLEnum,JSON
from sqlalchemy.orm import relationship
import enum

## User Role ##
class UserRole(str, enum.Enum):  
    admin = "admin"
    user = "user"
    recruiter = "recruiter"

## User Table ##
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone_number = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.user, nullable=False)  
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False) 
    extracted_text = Column(Text) 
    skills = Column(JSON)   
    experience = Column(JSON)   
    projects = Column(JSON)   
    education = Column(JSON)  

    user = relationship("User", back_populates="resumes")
    match_results = relationship("JobMatchResult", back_populates="resume", cascade="all, delete")

## JobDescription Table ##
class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String, nullable=False)
    company_name = Column(String)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON)  

    match_results = relationship("JobMatchResult", back_populates="job", cascade="all, delete")


## JobMatchScore Results Of AI Model ##
class JobMatchResult(Base):
    __tablename__ = "match_results"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    match_score = Column(Float, nullable=False)  
    missing_skills = Column(Text) 

    resume = relationship("Resume", back_populates="match_results")
    job = relationship("JobDescription", back_populates="match_results")
