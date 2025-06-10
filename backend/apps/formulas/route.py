from fastapi import APIRouter
from schema import MathMode, FormulaInfo
from formula_library import get_formulas_for_mode, get_formula_by_name
from typing import Dict, List

router = APIRouter()

@router.get('/by-mode/{mode}')
async def get_formulas_by_mode(mode: MathMode):
    """Get all formulas for a specific math mode"""
    formulas = get_formulas_for_mode(mode)
    return {
        "mode": mode,
        "formulas": [
            {
                "name": data["name"],
                "formula": data["formula"],
                "explanation": data["explanation"]
            }
            for _, data in formulas.items()
        ]
    }

@router.get('/search/{query}')
async def search_formula(query: str):
    """Search for a formula by name"""
    formula = get_formula_by_name(query)
    if formula:
        return {
            "found": True,
            "formula": {
                "name": formula["name"],
                "formula": formula["formula"],
                "explanation": formula["explanation"]
            }
        }
    return {"found": False}
