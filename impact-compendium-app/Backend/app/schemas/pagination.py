from pydantic import BaseModel
from typing import List, TypeVar, Generic

T = TypeVar('T')

class PageOut(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pageSize: int

    class Config:
        from_attributes = True
