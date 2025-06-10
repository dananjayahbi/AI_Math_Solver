# import torch
# from transformers import pipeline, BitsAndBytesConfig, AutoProcessor, LlavaForConditionalGeneration
# from PIL import Image

# # quantization_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
# quantization_config = BitsAndBytesConfig(
#     load_in_4bit=True,
#     bnb_4bit_compute_dtype=torch.float16
# )


# model_id = "llava-hf/llava-1.5-7b-hf"
# processor = AutoProcessor.from_pretrained(model_id)
# model = LlavaForConditionalGeneration.from_pretrained(model_id, quantization_config=quantization_config, device_map="auto")
# # pipe = pipeline("image-to-text", model=model_id, model_kwargs={"quantization_config": quantization_config})

# def analyze_image(image: Image):
#     prompt = "USER: <image>\nAnalyze the equation or expression in this image, and return answer in format: {expr: given equation in LaTeX format, result: calculated answer}"

#     inputs = processor(prompt, images=[image], padding=True, return_tensors="pt").to("cuda")
#     for k, v in inputs.items():
#         print(k,v.shape)

#     output = model.generate(**inputs, max_new_tokens=20)
#     generated_text = processor.batch_decode(output, skip_special_tokens=True)
#     for text in generated_text:
#         print(text.split("ASSISTANT:")[-1])

import google.generativeai as genai
import ast
import json
import re
from PIL import Image
from constants import GEMINI_API_KEY
from formula_library import get_formulas_for_mode, get_formula_by_name
from schema import MathMode

genai.configure(api_key=GEMINI_API_KEY)

def analyze_image(img: Image, dict_of_vars: dict, mode: str = MathMode.BASIC, detailed_steps: bool = False):
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    
    # Get relevant formulas for the requested mode
    formulas = get_formulas_for_mode(mode)
    formulas_str = json.dumps(formulas, ensure_ascii=False) if formulas else "{}"
    
    # Base prompt for all modes
    base_prompt = (
        f"You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. "
        f"You are operating in '{mode}' mode. "
    )
    
    # Mode-specific instructions
    mode_instructions = {
        MathMode.BASIC: (
            f"Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, "
            f"Multiplication and Division (from left to right), Addition and Subtraction (from left to right). "
            f"For example: "
            f"Q. 2 + 3 * 4 "
            f"(3 * 4) => 12, 2 + 12 = 14. "
            f"Q. 2 + 3 + 5 * 4 - 8 / 2 "
            f"5 * 4 => 20, 8 / 2 => 4, 2 + 3 => 5, 5 + 20 => 25, 25 - 4 => 21. "
        ),
        MathMode.ALGEBRA: (
            f"Focus on algebraic expressions and equations. Manipulate expressions, solve for variables, "
            f"factor polynomials, and simplify expressions. "
            f"For quadratic equations, use the quadratic formula x = (-b ± √(b² - 4ac))/2a when appropriate. "
            f"Apply factoring techniques when possible. "
        ),
        MathMode.CALCULUS: (
            f"Focus on calculus problems including derivatives, integrals, limits, and related topics. "
            f"When computing derivatives, apply appropriate rules (power rule, product rule, quotient rule, chain rule). "
            f"For integrals, use appropriate integration techniques and include the constant of integration. "
            f"For limits, try direct substitution first, then analytical methods if needed. "
        ),
        MathMode.GEOMETRY: (
            f"Focus on geometry problems including areas, volumes, angles, and spatial relationships. "
            f"For triangles, use the appropriate formulas (area = ½bh, Pythagorean theorem, etc.). "
            f"For circles, use area = πr² and circumference = 2πr. "
            f"Pay close attention to units and diagrams showing measurements. "
        ),
        MathMode.STATISTICS: (
            f"Focus on statistics problems including mean, median, mode, standard deviation, probability, "
            f"distributions, and data analysis. "
            f"For datasets, calculate descriptive statistics properly. "
            f"For probability problems, identify the correct probability model and apply appropriate formulas. "
            f"For distributions, use the correct probability density/mass functions. "
        )
    }
    
    # Steps instructions based on detailed_steps flag
    steps_instruction = ""
    if detailed_steps:
        steps_instruction = (
            f"For EACH problem, provide detailed step-by-step explanations. Break down the solution into logical steps, "
            f"explaining the reasoning at each point. Include relevant formulas used and why they apply. "
            f"The steps should be educational and help build understanding of the concepts involved. "
        )
    
    # Case handling instructions
    case_instructions = (
        f"YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME: "
        f"Following are the cases: "
        f"1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF ONE DICT ["
    )
    
    if detailed_steps:
        case_instructions += "{{'expr': given expression, 'result': calculated answer, 'steps': [step1, step2, step3, ...], 'formulas_used': [{{name: formula_name, formula: formula_text, explanation: explanation_text}}, ...]}}"
    else:
        case_instructions += "{{'expr': given expression, 'result': calculated answer}}"
    
    case_instructions += (
        "]. "
        f"2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS, with dict 1 as "
    )
    
    if detailed_steps:
        case_instructions += "{{'expr': 'x', 'result': 2, 'assign': True, 'steps': [step1, step2, step3, ...], 'formulas_used': [{{name: formula_name, formula: formula_text, explanation: explanation_text}}, ...]}}"
    else:
        case_instructions += "{{'expr': 'x', 'result': 2, 'assign': True}}"
    
    case_instructions += (
        " and dict 2 as "
    )
    
    if detailed_steps:
        case_instructions += "{{'expr': 'y', 'result': 5, 'assign': True, 'steps': [step1, step2, step3, ...], 'formulas_used': [{{name: formula_name, formula: formula_text, explanation: explanation_text}}, ...]}}"
    else:
        case_instructions += "{{'expr': 'y', 'result': 5, 'assign': True}}"
    
    case_instructions += (
        ". This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables. "
        f"3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {{'assign': True}}, keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS. "
        f"4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc. These will have a drawing representing some scenario and accompanying information with the image. PAY CLOSE ATTENTION TO DIFFERENT COLORS FOR THESE PROBLEMS. You need to return the answer in the format of a LIST OF ONE DICT ["
    )
    
    if detailed_steps:
        case_instructions += "{{'expr': given expression, 'result': calculated answer, 'steps': [step1, step2, step3, ...], 'formulas_used': [{{name: formula_name, formula: formula_text, explanation: explanation_text}}, ...]}}"
    else:
        case_instructions += "{{'expr': given expression, 'result': calculated answer}}"
    
    case_instructions += (
        "]. "
        f"5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept. "
    )

    # Final prompt assembly
    prompt = (
        f"{base_prompt}"
        f"{mode_instructions.get(mode, mode_instructions[MathMode.BASIC])}"
        f"{steps_instruction}"
        f"{case_instructions}"
        f"Analyze the equation or expression in this image and return the answer according to the given rules: "
        f"Make sure to use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc. "
        f"Here is a dictionary of user-assigned variables. If the given expression has any of these variables, use its actual value from this dictionary accordingly: {dict_of_vars_str}. "
        f"Here are relevant formulas that may apply to this '{mode}' problem: {formulas_str}. Use these when applicable and reference them in your answer. "
        f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING. "
        f"PROPERLY QUOTE THE KEYS AND VALUES IN THE DICTIONARY FOR EASIER PARSING WITH Python's ast.literal_eval."
    )
    
    response = model.generate_content([prompt, img])
    print(f"Mode: {mode}, Detailed Steps: {detailed_steps}")
    print(response.text)
    
    answers = []
    try:
        # Try to parse the response as a Python object
        response_text = response.text.strip()
        
        # Fix common JSON parsing issues
        response_text = re.sub(r'```(python|json)?\s*', '', response_text)
        response_text = re.sub(r'\s*```\s*', '', response_text)
        
        answers = ast.literal_eval(response_text)
    except Exception as e:
        print(f"Error in parsing response from Gemini API: {e}")
        print(f"Raw response: {response.text}")
    
    print('returned answer ', answers)
    
    # Process and standardize the answers
    for answer in answers:
        if 'assign' in answer:
            answer['assign'] = True
        else:
            answer['assign'] = False
            
        # Ensure steps is a list
        if detailed_steps and 'steps' not in answer:
            answer['steps'] = []
    
    return answers