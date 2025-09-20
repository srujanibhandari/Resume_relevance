# Backend - Automated Resume Relevance Check System

## Setup
1. Copy `.env.example` to `.env` and add your OpenAI API key.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```
   python app.py
   ```

## API Endpoint
- `POST /api/check_resume`
  - Body: `{ "resume": "...", "job_description": "..." }`
  - Returns: `{ "result": "..." }`
