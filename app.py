import os
import json
import tempfile
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
ALLOWED_EXTENSIONS = {'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'}

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def transcribe_audio(file_path):
    """Transcribe audio using OpenAI Whisper API."""
    with open(file_path, 'rb') as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
    return transcript


def analyze_meeting(transcript):
    """Use LLM to analyze meeting transcript and extract structured information."""
    prompt = f"""You are an expert meeting analyst. Analyze the following meeting transcript and extract structured information.

Return your response as a valid JSON object with exactly this structure:
{{
    "summary": "string - concise meeting summary (3-5 sentences)",
    "action_items": [
        {{
            "item": "string - description of action",
            "owner": "string - person responsible (or TBD if not specified)",
            "deadline": "string - deadline (or Not specified if not mentioned)"
        }}
    ],
    "tasks": [
        {{
            "task": "string - task description",
            "priority": "string - High/Medium/Low",
            "notes": "string - additional context"
        }}
    ],
    "key_decisions": [
        {{
            "decision": "string - decision made",
            "rationale": "string - reason for decision",
            "impact": "string - expected impact"
        }}
    ]
}}

Meeting Transcript:
{transcript}

Respond ONLY with the JSON object, no additional text."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a professional meeting analyst. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=2000
    )
    
    result_text = response.choices[0].message.content.strip()
    
    # Remove markdown code blocks if present
    if result_text.startswith('```'):
        lines = result_text.split('\n')
        result_text = '\n'.join(lines[1:-1])
    
    return json.loads(result_text)


@app.route('/')
def index():
    """Serve the main HTML page."""
    return render_template('index.html')


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main endpoint: handle audio upload, transcription, and analysis."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'File type not supported. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    suffix = '.' + file.filename.rsplit('.', 1)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        file.save(tmp_file.name)
        tmp_path = tmp_file.name
    
    try:
        transcript = transcribe_audio(tmp_path)
        
        if not transcript or len(transcript.strip()) < 10:
            return jsonify({'error': 'Could not extract meaningful text from audio'}), 400
        
        analysis = analyze_meeting(transcript)
        
        return jsonify({
            'success': True,
            'transcript': transcript,
            'analysis': analysis
        })
    
    except openai.AuthenticationError:
        return jsonify({'error': 'Invalid OpenAI API key'}), 401
    except openai.RateLimitError:
        return jsonify({'error': 'OpenAI rate limit exceeded. Please try again.'}), 429
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse AI response: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    api_key = os.environ.get('OPENAI_API_KEY')
    return jsonify({
        'status': 'healthy',
        'api_key_configured': bool(api_key and api_key != 'your-api-key-here')
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
