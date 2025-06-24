from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas, security

# Funções CRUD para User
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def reset_user_password(db: Session, email: str, new_password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    from .security import get_password_hash
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

# Funções CRUD para Account
def create_account(db: Session, account: schemas.AccountCreate, owner_id: int):
    db_account = models.Account(**account.dict(), owner_id=owner_id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_account(db: Session, account_id: int):
    return db.query(models.Account).filter(models.Account.id == account_id).first()

def get_accounts_by_user(db: Session, owner_id: int) -> List[models.Account]:
    return db.query(models.Account).filter(models.Account.owner_id == owner_id).all()

def update_account(db: Session, account_id: int, account_data: schemas.AccountCreate):
    db_account = get_account(db, account_id)
    if db_account:
        for key, value in account_data.dict().items():
            setattr(db_account, key, value)
        db.commit()
        db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int):
    db_account = get_account(db, account_id)
    if db_account:
        db.delete(db_account)
        db.commit()
    return db_account

# Funções CRUD para Transaction
def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def get_transactions_by_account(
    db: Session,
    account_id: int,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Transaction).filter(models.Transaction.account_id == account_id)
    if category:
        query = query.filter(models.Transaction.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(models.Transaction.description.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_transaction(db: Session, transaction_id: int, transaction_data: schemas.TransactionUpdate):
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        update_data = transaction_data.model_dump(exclude_unset=True)
        
        # Garante que o valor da transação seja sempre positivo
        if 'value' in update_data and update_data['value'] is not None:
            update_data['value'] = abs(float(update_data['value']))

        for key, value in update_data.items():
            setattr(db_transaction, key, value)
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

def update_transaction_paid_status(db: Session, transaction_id: int, paid: bool):
    """Atualiza apenas o status 'paid' de uma transação."""
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        setattr(db_transaction, 'paid', paid)
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
    return db_transaction

# Funções CRUD para Transaction (exemplo)
def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).offset(skip).limit(limit).all() 