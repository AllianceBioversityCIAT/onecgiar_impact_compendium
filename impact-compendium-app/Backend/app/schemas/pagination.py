from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageOut(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pageSize: int

    class Config:
        from_attributes = True
