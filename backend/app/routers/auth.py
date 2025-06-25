from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from .. import schemas, crud, models, security
from ..database import get_db
from ..utils_email import send_reset_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

router = APIRouter()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    if token_data.email is None:
        raise credentials_exception
        
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if current_user.is_active != True:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password): # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": schemas.User.model_validate(user)}

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, request.email)
    if not user:
        # Não revela se o e-mail existe ou não
        return {"msg": "Se o e-mail existir, um link de redefinição foi enviado."}
    from ..security import create_reset_password_token
    token = create_reset_password_token(user.email)
    reset_link = f"https://financas-app-mu.vercel.app//reset-password?token={token}"
    subject = "Redefinição de senha"
    body = f"<p>Para redefinir sua senha, clique no link abaixo:</p><p><a href='{reset_link}'>Redefinir senha</a></p>"
    send_reset_email(user.email, subject, body)
    return {"msg": "Se o e-mail existir, um link de redefinição foi enviado."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    from ..security import verify_reset_password_token
    email = verify_reset_password_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    crud.reset_user_password(db, email, request.new_password)
    return {"msg": "Senha redefinida com sucesso!"} 