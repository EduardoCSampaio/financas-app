from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil
import uuid
from .. import schemas, crud, models
from ..database import get_db
from .auth import get_current_active_user
from sqlalchemy.sql.schema import Column
from pydantic import BaseModel

router = APIRouter()

UPLOAD_DIRECTORY = "backend/static/uploads"

def save_upload_file(upload_file: UploadFile) -> str:
    """Salva o arquivo de upload e retorna o caminho do arquivo."""
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")
    try:
        # Gerar um nome de arquivo único
        extension = upload_file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{extension}"
        file_path = f"{UPLOAD_DIRECTORY}/{filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        return f"/static/uploads/{filename}"
    finally:
        upload_file.file.close()

# Rotas para transações (agora exigem account_id)
@router.post("/", response_model=schemas.Transaction)
def create_transaction(
    description: str = Form(...),
    value: float = Form(...),
    type: str = Form(...),
    date: datetime = Form(...),
    paid: bool = Form(...),
    account_id: int = Form(...),
    category_id: Optional[int] = Form(None),
    proof: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Validar se a conta pertence ao usuário
    account = crud.get_account(db, account_id)
    if account is None or getattr(account, "owner_id", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Conta não encontrada ou não pertence ao usuário.")

    proof_url = None
    if proof and proof.filename:
        proof_url = save_upload_file(proof)

    # Criar o objeto Pydantic a partir dos dados do formulário
    transaction_data = schemas.TransactionCreate(
        description=description,
        value=value,
        type=type,
        date=date,
        paid=paid,
        account_id=account_id,
        proof_url=proof_url,
        category_id=category_id
    )
    
    return crud.create_transaction(db=db, transaction=transaction_data)

@router.get("/", response_model=schemas.PaginatedTransactions)
def read_transactions(
    account_id: int,
    page: int = 1,
    limit: int = 10,
    category: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Lista transações da conta, com filtros opcionais de categoria, busca, data inicial e final.
    - start_date e end_date devem ser strings no formato ISO (ex: 2024-06-01).
    """
    account = crud.get_account(db, account_id)
    if account is None or getattr(account, "owner_id", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Conta não encontrada ou não pertence ao usuário.")
    skip = (page - 1) * limit
    transactions_data = crud.get_transactions_by_account(
        db, account_id=account_id, category=category, search=search, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date
    )
    return {
        **transactions_data,
        "page": page,
        "size": limit
    }

@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction_route(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    description: str = Form(...),
    value: float = Form(...),
    type: str = Form(...),
    date: datetime = Form(...),
    paid: bool = Form(...),
    category_id: Optional[int] = Form(None),
    proof: Optional[UploadFile] = File(None),
):
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verificar permissão
    account_id = db_transaction.account_id
    if not isinstance(account_id, int):
        raise TypeError(f"Invalid account ID: {account_id}") # type: ignore
        
    account = crud.get_account(db, account_id) # type: ignore
    if not account or getattr(account, 'owner_id', None) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this transaction")
    
    proof_url = db_transaction.proof_url if db_transaction.proof_url is None or isinstance(db_transaction.proof_url, str) else str(db_transaction.proof_url)
    if proof and proof.filename:
        proof_url = save_upload_file(proof)

    transaction_data = schemas.TransactionUpdate(
        description=description,
        value=value,
        type=type,
        date=date,
        paid=paid,
        proof_url=proof_url,
        category_id=category_id
    )
    
    return crud.update_transaction(db=db, transaction_id=transaction_id, transaction_data=transaction_data)

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction_route(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account_id = db_transaction.account_id
    if not isinstance(account_id, int):
        # This case should ideally not happen if the DB is consistent
        raise TypeError(f"ID da conta inválido: {account_id}")

    account = crud.get_account(db, account_id)
    if account is None or getattr(account, "owner_id", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this transaction")
    crud.delete_transaction(db=db, transaction_id=transaction_id)
    return {"ok": True}

# Schema para o corpo da requisição do toggle
class PaidUpdate(BaseModel):
    paid: bool

@router.patch("/{transaction_id}/toggle-paid", response_model=schemas.Transaction)
def toggle_transaction_paid_status(
    transaction_id: int,
    update_data: PaidUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    # Verificar permissão
    account_id = db_transaction.account_id
    if not isinstance(account_id, int):
        raise TypeError(f"ID da conta inválido na transação: {account_id}")
        
    account = crud.get_account(db, account_id)
    if not account or getattr(account, 'owner_id', None) != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado")

    return crud.update_transaction_paid_status(db=db, transaction_id=transaction_id, paid=update_data.paid)

# --- NOVO: Rotas para categorias ---
from fastapi import APIRouter
category_router = APIRouter(prefix="/categories", tags=["categories"])

@category_router.get("/", response_model=List[schemas.Category])
def list_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.get_categories(db)

@category_router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_category = crud.create_category(db, category)
    return db_category

@category_router.put("/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_category = crud.update_category(db, category_id, category)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return db_category

@category_router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_category = crud.delete_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return None 