// Types for MathJax 3.x
export interface MathJaxConfig {
  tex?: {
    inlineMath?: Array<[string, string]>;
    displayMath?: Array<[string, string]>;
    processEscapes?: boolean;
  };
  options?: {
    enableMenu?: boolean;
  };
}

export interface MathJaxObject {
  startup?: {
    promise: Promise<unknown>;
  };
  typesetPromise?: (elements?: Element[] | string[] | NodeList) => Promise<unknown>;
  typeset?: (elements?: Element[] | string[] | NodeList) => void;
  tex2chtml?: (tex: string, options?: Record<string, unknown>) => Element;
}

// Extend Window interface to include MathJax
declare global {
  interface Window {
    MathJax: MathJaxObject;
  }
}
