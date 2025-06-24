from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, models, security
from ..database import get_db
from .auth import get_current_active_user

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