from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/categories", tags=["Categories"])


class CategoryInfo(BaseModel):
    value: str
    label: str


CATEGORIES: list[CategoryInfo] = [
    CategoryInfo(value="Illegal Dumping",  label="Illegal Dumping"),
    CategoryInfo(value="Missed Pickup",    label="Missed Pickup"),
    CategoryInfo(value="Overflowing Bin",  label="Overflowing Bin"),
    CategoryInfo(value="Hazardous Waste",  label="Hazardous Waste"),
    CategoryInfo(value="Recycling Issue",  label="Recycling Issue"),
    CategoryInfo(value="Bulk Waste",       label="Bulk Waste"),
    CategoryInfo(value="Other",            label="Other"),
]

PRIORITIES = ["Low", "Medium", "High", "Critical"]


@router.get("", response_model=list[CategoryInfo], summary="Fetch all report categories")
async def get_categories():
    return CATEGORIES


@router.get("/priorities", response_model=list[str], summary="Fetch priority levels")
async def get_priorities():
    return PRIORITIES
