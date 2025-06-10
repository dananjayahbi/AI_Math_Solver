from pydantic import BaseModel
from enum import Enum
from typing import Optional, List, Dict, Any

class MathMode(str, Enum):
    BASIC = "basic"
    ALGEBRA = "algebra"
    CALCULUS = "calculus"
    GEOMETRY = "geometry"
    STATISTICS = "statistics"

class ImageData(BaseModel):
    image: str
    dict_of_vars: dict
    mode: MathMode = MathMode.BASIC
    detailed_steps: bool = False

class FormulaInfo(BaseModel):
    name: str
    formula: str
    explanation: str

class MathSolution(BaseModel):
    expr: str
    result: Any
    steps: Optional[List[str]] = None
    assign: bool = False
    formulas_used: Optional[List[FormulaInfo]] = None
