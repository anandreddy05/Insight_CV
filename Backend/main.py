from fastapi import FastAPI
from routers import admin,recruiter,login, user
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend dev URL
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)



app.include_router(login.router)
app.include_router(admin.router)
app.include_router(user.router)
app.include_router(recruiter.router)