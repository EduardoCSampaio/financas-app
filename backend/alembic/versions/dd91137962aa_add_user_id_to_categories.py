"""add user_id to categories

Revision ID: dd91137962aa
Revises: 12f266e26973
Create Date: 2025-06-27 16:36:05.843020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd91137962aa'
down_revision: Union[str, Sequence[str], None] = '12f266e26973'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('categories', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'categories', 'users', ['user_id'], ['id'])
    op.create_index(op.f('ix_users_document'), 'users', ['document'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_document'), table_name='users')
    op.drop_constraint(None, 'categories', type_='foreignkey')
    op.drop_column('categories', 'user_id')
    # ### end Alembic commands ###
