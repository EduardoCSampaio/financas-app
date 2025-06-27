from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, transactions, users, accounts
import os
import subprocess

# Criar diretório de uploads se não existir
if not os.path.exists("backend/static/uploads"):
    os.makedirs("backend/static/uploads")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Financeira Premium",
    description="Backend para o sistema financeiro com FastAPI, Next.js e Tailwind CSS.",
    version="1.0.0",
)

# Montar diretório estático
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

origins = [
    "https://financas-app-mu.vercel.app",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Voltando à forma original, sem o /api
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transações"])
app.include_router(users.router, prefix="/users", tags=["Usuários"])
app.include_router(accounts.router, prefix="/accounts", tags=["Contas"])
from .routers.transactions import category_router
app.include_router(category_router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Bem-vindo à API Financeira Premium!"}

@app.get("/run-migrations")
def run_migrations():
    result = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
    return {"stdout": result.stdout, "stderr": result.stderr}
