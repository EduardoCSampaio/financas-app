from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    user_id: int | None = None

class CategoryUpdate(BaseModel):
    name: str

class CategoryOut(CategoryBase):
    id: int
    user_id: int | None = None
    limit: float | None = None  # Orçamento mensal opcional
    class Config:
        orm_mode = True

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    description: str
    value: float
    type: str  # 'receita' ou 'despesa'
    date: datetime
    paid: bool = False
    proof_url: Optional[str] = None
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    account_id: int # Para qual conta essa transação vai

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    value: Optional[float] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    paid: Optional[bool] = None
    proof_url: Optional[str] = None
    category_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    account_id: int
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

class PaginatedTransactions(BaseModel):
    items: List[Transaction]
    total: int
    page: int
    size: int

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str
    type: str
    initial_balance: float = 0.0

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    owner_id: int
    transactions: List[Transaction] = []
    model_config = ConfigDict(from_attributes=True)

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    account_type: str = 'cpf'
    document: str
    name: str
    photo_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    accounts: List[Account] = []
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str

class CategoryBudgetBase(BaseModel):
    category_id: int
    limit: float
    month: str | None = None

class CategoryBudgetCreate(CategoryBudgetBase):
    pass

class CategoryBudgetUpdate(BaseModel):
    limit: float
    month: str | None = None

class CategoryBudgetOut(CategoryBudgetBase):
    id: int
    user_id: int
    class Config:
        orm_mode = True 