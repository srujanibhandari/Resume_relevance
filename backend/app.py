from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import os
from langchain_google_genai import GoogleGenerativeAI
from dotenv import load_dotenv
from pymongo import MongoClient
from backend.utils import extract_text_from_pdf, extract_text_from_docx


app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
jwt = JWTManager(app)


# Load environment variables from .env
load_dotenv()


# MongoDB setup
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
mongo_client = MongoClient(MONGO_URI)
try:
    # The ismaster command is cheap and does not require auth.
    mongo_client.admin.command('ismaster')
    print('MongoDB connection: SUCCESS')
except Exception as e:
    print(f'MongoDB connection: FAILED - {e}')
db = mongo_client['resume_db']
resumes_collection = db['resumes']
users_collection = db['users']
# User signup endpoint
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    company_name = data.get('company_name')
    user_name = data.get('user_name')
    designation = data.get('designation')
    company_mail = data.get('company_mail')
    if not email or not password or not company_name or not user_name or not designation or not company_mail:
        return jsonify({'error': 'All fields are required'}), 400
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 409
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({
        'email': email,
        'password': hashed,
        'company_name': company_name,
        'user_name': user_name,
        'designation': designation,
        'company_mail': company_mail
    })
    return jsonify({'message': 'Signup successful'})

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = users_collection.find_one({'email': email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=email)
    return jsonify({'access_token': access_token})

# Initialize Gemini LLM via LangChain
llm = GoogleGenerativeAI(google_api_key=os.getenv('GEMINI_API_KEY'), model = "gemini-2.0-flash")

@app.route('/api/check_resume', methods=['POST'])
def check_resume():
    if 'resume' not in request.files or 'job_description' not in request.form:
        return jsonify({'error': 'Missing resume file or job description'}), 400
    job_role = request.form.get('job_role', '')
    location = request.form.get('location', '')
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

Missing Skills/Projects/Certifications:
- List any important skills, projects, or certifications from the job description that are missing in the resume.

Areas for Improvement (Not affecting relevance score much):
- Mention small gaps that could be improved.

Verdict:
- Give a final verdict on the candidate’s suitability for the job (High / Medium / Low suitability).

Suggestions for Student Improvement:
- Provide actionable suggestions for the candidate to improve their resume or profile for this job.

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
    # Save resume review data to MongoDB
    review_data = {
        'filename': filename,
        'job_description': job_description,
        'resume_text': resume_text,
        'review_result': result,
        'job_role': job_role,
        'location': location
    }
    resumes_collection.insert_one(review_data)
    return jsonify({'result': result})



# Endpoint to get all resume review data (protected)
@app.route('/api/resumes', methods=['GET'])
@jwt_required()
def get_all_resumes():
    query = {}
    job_role = request.args.get('job_role')
    location = request.args.get('location')
    min_score = request.args.get('min_score')
    max_score = request.args.get('max_score')
    if job_role:
        query['job_role'] = {'$regex': job_role, '$options': 'i'}
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    resumes = list(resumes_collection.find(query, {'_id': 0}))
    # Filter by score if needed
    if min_score or max_score:
        filtered = []
        for r in resumes:
            score = None
            if isinstance(r.get('review_result'), str):
                import re
                m = re.search(r'(\d{1,3})', r['review_result'])
                if m:
                    score = int(m.group(1))
            if score is not None:
                if min_score and score < int(min_score):
                    continue
                if max_score and score > int(max_score):
                    continue
            filtered.append(r)
        resumes = filtered
    return jsonify({'resumes': resumes})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

