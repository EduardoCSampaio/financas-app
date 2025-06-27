from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas, security
from datetime import datetime
from .models import CategoryBudget, Category
from .schemas import CategoryBudgetCreate, CategoryBudgetUpdate, CategoryCreate, CategoryUpdate

# Funções CRUD para User
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        account_type=user.account_type,
        document=user.document
    )
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
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = db.query(models.Transaction).filter(models.Transaction.account_id == account_id)
    if category:
        query = query.filter(models.Transaction.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(models.Transaction.description.ilike(f"%{search}%"))
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(models.Transaction.date >= start_dt)
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(models.Transaction.date <= end_dt)
        except Exception:
            pass
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

# Funções CRUD para Category
def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def update_category(db: Session, category_id: int, category_data: schemas.CategoryCreate):
    db_category = get_category(db, category_id)
    if db_category:
        for key, value in category_data.dict().items():
            setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category

def get_category_budget(db: Session, user_id: int, category_id: int, month: str | None = None):
    query = db.query(CategoryBudget).filter(CategoryBudget.user_id == user_id, CategoryBudget.category_id == category_id)
    if month:
        query = query.filter(CategoryBudget.month == month)
    return query.first()

def get_category_budgets(db: Session, user_id: int):
    return db.query(CategoryBudget).filter(CategoryBudget.user_id == user_id).all()

def create_or_update_category_budget(db: Session, user_id: int, data: CategoryBudgetCreate):
    budget = get_category_budget(db, user_id, data.category_id, data.month)
    if budget:
        budget.limit = data.limit
        budget.month = data.month
    else:
        budget = CategoryBudget(user_id=user_id, **data.dict())
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

def delete_category_budget(db: Session, user_id: int, category_id: int, month: str | None = None):
    budget = get_category_budget(db, user_id, category_id, month)
    if budget:
        db.delete(budget)
        db.commit()
        return True
    return False

# CRUD para categorias personalizadas

# Listar categorias do usuário

def get_user_categories(db: Session, user_id: int):
    return db.query(Category).filter((Category.user_id == user_id) | (Category.user_id == None)).all()

# Criar categoria personalizada

def create_user_category(db: Session, user_id: int, data: CategoryCreate):
    category = Category(name=data.name, user_id=user_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

# Editar categoria personalizada

def update_user_category(db: Session, user_id: int, category_id: int, data: CategoryUpdate):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if category:
        category.name = data.name
        db.commit()
        db.refresh(category)
    return category

# Deletar categoria personalizada

def delete_user_category(db: Session, user_id: int, category_id: int):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if category:
        db.delete(category)
        db.commit()
        return True
    return False 