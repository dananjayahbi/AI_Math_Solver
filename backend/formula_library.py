"""
Formula reference library for different branches of mathematics
"""

# Basic Arithmetic
BASIC_FORMULAS = {
    "pemdas": {
        "name": "PEMDAS",
        "formula": "Parentheses, Exponents, Multiplication/Division, Addition/Subtraction",
        "explanation": "The order of operations in mathematics: first compute expressions in parentheses, then exponents, then multiplication and division from left to right, finally addition and subtraction from left to right."
    }
}

# Algebra Formulas
ALGEBRA_FORMULAS = {
    "quadratic_formula": {
        "name": "Quadratic Formula",
        "formula": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        "explanation": "The solution to a quadratic equation in the form ax² + bx + c = 0"
    },
    "difference_of_squares": {
        "name": "Difference of Squares",
        "formula": "a^2 - b^2 = (a + b)(a - b)",
        "explanation": "Factoring formula for the difference of two squared terms"
    },
    "completing_the_square": {
        "name": "Completing the Square",
        "formula": "ax^2 + bx = a(x^2 + \\frac{b}{a}x) = a(x + \\frac{b}{2a})^2 - \\frac{b^2}{4a}",
        "explanation": "A technique to convert a quadratic expression into a perfect square binomial plus a constant"
    }
}

# Calculus Formulas
CALCULUS_FORMULAS = {
    "power_rule": {
        "name": "Power Rule",
        "formula": "\\frac{d}{dx}(x^n) = nx^{n-1}",
        "explanation": "Derivative of x raised to a power"
    },
    "product_rule": {
        "name": "Product Rule",
        "formula": "\\frac{d}{dx}[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)",
        "explanation": "Derivative of a product of two functions"
    },
    "chain_rule": {
        "name": "Chain Rule",
        "formula": "\\frac{d}{dx}[f(g(x))] = f'(g(x))g'(x)",
        "explanation": "Derivative of a composite function"
    },
    "integration_by_parts": {
        "name": "Integration by Parts",
        "formula": "\\int u(x)v'(x)dx = u(x)v(x) - \\int v(x)u'(x)dx",
        "explanation": "A technique to find the integral of a product of functions"
    }
}

# Geometry Formulas
GEOMETRY_FORMULAS = {
    "circle_area": {
        "name": "Circle Area",
        "formula": "A = \\pi r^2",
        "explanation": "Area of a circle with radius r"
    },
    "circle_circumference": {
        "name": "Circle Circumference",
        "formula": "C = 2\\pi r",
        "explanation": "Circumference of a circle with radius r"
    },
    "rectangle_area": {
        "name": "Rectangle Area",
        "formula": "A = l \\times w",
        "explanation": "Area of a rectangle with length l and width w"
    },
    "triangle_area": {
        "name": "Triangle Area",
        "formula": "A = \\frac{1}{2} \\times b \\times h",
        "explanation": "Area of a triangle with base b and height h"
    },
    "pythagorean_theorem": {
        "name": "Pythagorean Theorem",
        "formula": "a^2 + b^2 = c^2",
        "explanation": "In a right triangle, the square of the hypotenuse (c) equals the sum of squares of the other two sides (a and b)"
    },
    "volume_sphere": {
        "name": "Sphere Volume",
        "formula": "V = \\frac{4}{3}\\pi r^3",
        "explanation": "Volume of a sphere with radius r"
    }
}

# Statistics Formulas
STATISTICS_FORMULAS = {
    "mean": {
        "name": "Arithmetic Mean",
        "formula": "\\mu = \\frac{\\sum_{i=1}^{n} x_i}{n}",
        "explanation": "The sum of all values divided by the number of values"
    },
    "standard_deviation": {
        "name": "Standard Deviation",
        "formula": "\\sigma = \\sqrt{\\frac{\\sum_{i=1}^{n} (x_i - \\mu)^2}{n}}",
        "explanation": "A measure of the amount of variation or dispersion of a set of values"
    },
    "normal_distribution": {
        "name": "Normal Distribution",
        "formula": "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}(\\frac{x-\\mu}{\\sigma})^2}",
        "explanation": "Probability density function for a normal distribution with mean μ and standard deviation σ"
    },
    "correlation_coefficient": {
        "name": "Pearson Correlation Coefficient",
        "formula": "r = \\frac{\\sum_{i=1}^{n} (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum_{i=1}^{n} (x_i - \\bar{x})^2 \\sum_{i=1}^{n} (y_i - \\bar{y})^2}}",
        "explanation": "A measure of linear correlation between two sets of data"
    }
}

# Dictionary mapping math modes to formula collections
MODE_TO_FORMULAS = {
    "basic": BASIC_FORMULAS,
    "algebra": ALGEBRA_FORMULAS,
    "calculus": CALCULUS_FORMULAS,
    "geometry": GEOMETRY_FORMULAS,
    "statistics": STATISTICS_FORMULAS
}

def get_formulas_for_mode(mode: str):
    """Return formulas for the specified math mode"""
    return MODE_TO_FORMULAS.get(mode, {})

def get_formula_by_name(name: str):
    """Search for a formula by name across all modes"""
    for formulas in MODE_TO_FORMULAS.values():
        if name in formulas:
            return formulas[name]
    return None
