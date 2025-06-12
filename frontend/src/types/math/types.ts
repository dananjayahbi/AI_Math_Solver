// Types and interfaces for the math solver application

/**
 * Represents information about a mathematical formula
 */
export interface FormulaInfo {
  name: string;
  formula: string;
  explanation: string;
}

/**
 * Custom type that can represent all possible math result types
 */
export type MathResult = string | number | boolean | null;

/**
 * Represents a LaTeX expression with position information
 */
export interface LatexExpressionItem {
  latex: string;
  position: { x: number; y: number };
}

/**
 * Represents the result of a generated math solution
 */
export interface GeneratedResult {
  expression: string;
  answer: MathResult;
  steps?: string[];
  formulas_used?: FormulaInfo[];
}

/**
 * Represents the API response format
 */
export interface MathApiResponse {
  expr: string;
  result: MathResult;
  assign: boolean;
  steps?: string[];
  formulas_used?: FormulaInfo[];
}

/**
 * Represents selection bounds
 */
export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Represents a point with x,y coordinates
 */
export interface Point {
  x: number;
  y: number;
}
