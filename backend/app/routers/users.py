from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, models, security
from ..database import get_db
from .auth import get_current_active_user, get_current_user
from typing import Optional
from ..schemas import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@router.put("/me/change-password")
def change_password(
    password_data: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verificar a senha antiga
    if not security.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha antiga incorreta.")
    
    # Hashear e salvar a nova senha
    hashed_password = security.get_password_hash(password_data.new_password)
    setattr(current_user, 'hashed_password', hashed_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Senha alterada com sucesso."}

@router.post("/reset-password", response_model=schemas.User)
def reset_password(
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Aqui você pode checar se current_user é admin, se quiser
    user = crud.reset_user_password(db, data.email, data.new_password)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.get("/budgets", response_model=list[schemas.CategoryBudgetOut])
def list_category_budgets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_category_budgets(db, current_user.id)

@router.post("/budgets", response_model=schemas.CategoryBudgetOut)
def set_category_budget(data: schemas.CategoryBudgetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_or_update_category_budget(db, current_user.id, data)

@router.delete("/budgets/{category_id}")
def delete_category_budget(category_id: int, month: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ok = crud.delete_category_budget(db, current_user.id, category_id, month)
    if not ok:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"ok": True}

@router.get("/categories", response_model=list[CategoryOut])
def list_user_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_user_categories(db, current_user.id)

@router.post("/categories", response_model=CategoryOut)
def create_user_category(data: CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_user_category(db, current_user.id, data)

@router.put("/categories/{category_id}", response_model=CategoryOut)
def update_user_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cat = crud.update_user_category(db, current_user.id, category_id, data)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return cat

@router.delete("/categories/{category_id}")
def delete_user_category(category_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ok = crud.delete_user_category(db, current_user.id, category_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"ok": True} 