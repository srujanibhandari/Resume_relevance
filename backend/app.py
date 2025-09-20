from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
from langchain_google_genai import GoogleGenerativeAI
from dotenv import load_dotenv
from utils import extract_text_from_pdf, extract_text_from_docx

app = Flask(__name__)
CORS(app)

# Load environment variables from .env
load_dotenv()

# Initialize Gemini LLM via LangChain
llm = GoogleGenerativeAI(google_api_key=os.getenv('GEMINI_API_KEY'), model = "gemini-2.0-flash")

@app.route('/api/check_resume', methods=['POST'])
def check_resume():
    if 'resume' not in request.files or 'job_description' not in request.form:
        return jsonify({'error': 'Missing resume file or job description'}), 400
    file = request.files['resume']
    job_description = request.form['job_description']
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    temp_path = os.path.join('temp', filename)
    os.makedirs('temp', exist_ok=True)
    file.save(temp_path)
    if ext == '.pdf':
        resume_text = extract_text_from_pdf(temp_path)
    elif ext in ['.doc', '.docx']:
        resume_text = extract_text_from_docx(temp_path)
    else:
        os.remove(temp_path)
        return jsonify({'error': 'Unsupported file type'}), 400
    os.remove(temp_path)
    prompt = f"""
You are an expert resume reviewer.
Compare the following Resume and Job Description, and provide:
1. Relevance Score (0–100) as a single number.
2. A clear, structured review with these sections:

Experience Alignment:
- Briefly explain how the candidate’s work history aligns (or does not) with the job requirements.

Skills Match:
- Compare the listed skills in the resume to the job description requirements.

Education:
- Evaluate if the candidate’s education meets the job requirements.

Summary Alignment:
- Check if the resume’s professional summary aligns with the job focus.

Nice-to-Have Skills:
- Mention any additional skills or certifications that add value beyond the core requirements.

Areas for Improvement (Not affecting relevance score much):
- Mention small gaps that could be improved.

Overall Brief Summary:
- A 2–3 sentence summary of how well the candidate fits the job.

Format your output with:
- Section headings (no stars, no markdown)
- Bulleted lists for details under each section
- No extra symbols, no markdown formatting
- Keep the output clean, readable, and professional

Resume:
{resume_text}

Job Description:
{job_description}
"""
    result = llm(prompt)
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)
