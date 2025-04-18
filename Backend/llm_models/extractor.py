import tempfile
# from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import re
from docx import Document
import json
import logging
from typing import Dict, Any

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Initialize AI Model
# model = ChatOllama(model="gemma:7b", temperature=0.3)  
model = ChatGroq(model="llama3-8b-8192", temperature=0.3)

parser = StrOutputParser()

def extract_contact_info(text: str) -> tuple[list[str], list[str]]:
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'(?:\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    return emails, phones

def extract_resume_data(file) -> Dict[str, Any]:
    file_extension = file.filename.split('.')[-1].lower()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
        temp_file.write(file.file.read())
        temp_path = temp_file.name
    
    try:
        if file_extension == 'pdf':
            loader = PyPDFLoader(temp_path)
            docs = loader.load()
            content = ' '.join([doc.page_content for doc in docs])
        elif file_extension == 'docx':
            doc = Document(temp_path)
            content = ' '.join([para.text for para in doc.paragraphs])
        else:
            raise ValueError("Unsupported file type. Please upload a PDF or DOCX file.")
    except Exception as e:
        logging.error(f"Error loading file: {e}")
        os.remove(temp_path)
        raise

    # Extract contact info
    emails, phones = extract_contact_info(content)
    logging.info(f"Extracted emails: {emails}, phones: {phones}")

    prompt = PromptTemplate(
    template="""
    Analyze the following resume text and extract structured information in JSON format:

    Resume Text:
    {text}

    Extract the following information:
    - Full name (string)
    - Skills (list of strings)
    - Work experience (list of objects with company, role, years)
    - Projects (list of objects with project_name, tech_stack, description)
    - Education (list of objects with institution, degree, years, cgpa/marks/percentage)

    IMPORTANT: 
    - Return ONLY a valid JSON object. Do not include any additional text or explanations. 
    - If education details contain CGPA, percentage, or marks, include it under the `"cgpa"` field.
    - If CGPA is missing but marks/percentage exist, include that instead.
    - If none of these are available, return `"N/A"`.
    - Make sure to strip the resume text 
        - Example: 
            wrong: A n a n d is wrong
            correct: Anand

    The JSON should follow this exact structure:
    {{
        "name": "string",
        "skills": ["list", "of", "strings"],
        "experience": [
            {{
                "company": "string",
                "role": "string",
                "years": "string"
            }}
        ],
        "projects": [
            {{
                "project_name": "string",
                "tech_stack": ["list", "of", "strings"],
                "description": "string"
            }}
        ],
        "education": [
            {{
                "institution": "string",
                "degree": "string",
                "years": "string",
                "cgpa": "string"  # Can be CGPA, marks, or percentage
            }}
        ]
    }}

    Example:
    If the education section in the resume says:
    - "B.Tech in Computer Science from XYZ University, 2018-2022, 8.5 CGPA"
    - "Higher Secondary School, ABC School, 85%"
    
    It should be extracted as:
    ```json
    "education": [
        {{
            "institution": "XYZ University",
            "degree": "B.Tech in Computer Science",
            "years": "2018-2022",
            "cgpa": "8.5"
        }},
        {{
            "institution": "ABC School",
            "degree": "Higher Secondary",
            "years": "N/A",
            "cgpa": "85%"
        }}
    ]
    ```
    
    Now analyze this resume and return the JSON:
    """
)

    chain = prompt | model | parser
    
    try:
        response_data = chain.invoke({"text": content})
        logging.info(f"Raw LLM response: {response_data}")
        
        # Clean the response to extract just the JSON
        json_start = response_data.find('{')
        json_end = response_data.rfind('}') + 1
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON found in response")
        
        json_str = response_data[json_start:json_end]
        extracted_data = json.loads(json_str)
        
        # Validate basic structure
        if not all(key in extracted_data for key in ["name", "skills", "experience", "projects", "education"]):
            raise ValueError("Missing required fields in JSON response")
            
    except Exception as e:
        logging.error(f"Error processing LLM response: {e}")
        logging.error(f"Response content: {response_data}")
        raise ValueError(f"Failed to parse resume data: {str(e)}")
    finally:
        os.remove(temp_path)  

    return extracted_data