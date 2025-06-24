from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, models
from ..database import get_db
from .auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Account)
def create_account(
    account: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_account(db=db, account=account, owner_id=current_user.id)  # type: ignore

@router.get("/", response_model=List[schemas.Account])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_accounts_by_user(db=db, owner_id=current_user.id)  # type: ignore

@router.get("/{account_id}", response_model=schemas.Account)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    account = crud.get_account(db, account_id)
    if account is None or getattr(account, 'owner_id', None) != current_user.id:
        raise HTTPException(status_code=404, detail="Conta não encontrada ou não pertence ao usuário.")
    return account

@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    account_id: int,
    account_data: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    account = crud.get_account(db, account_id)
    if account is None or getattr(account, 'owner_id', None) != current_user.id:
        raise HTTPException(status_code=404, detail="Conta não encontrada ou não pertence ao usuário.")
    return crud.update_account(db, account_id, account_data)

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    account = crud.get_account(db, account_id)
    if account is None or getattr(account, 'owner_id', None) != current_user.id:
        raise HTTPException(status_code=404, detail="Conta não encontrada ou não pertence ao usuário.")
    crud.delete_account(db, account_id)
    return {"ok": True} 