# 🧑‍💼 AI Meeting Assistant

> Upload meeting audio → Get AI-generated summaries, action items, tasks & key decisions instantly

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper%20%2B%20GPT-orange.svg)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## ✨ Features

- 🎙️ **Audio Transcription** — Powered by OpenAI Whisper (supports MP3, WAV, M4A, OGG, FLAC, WebM, MP4)
- 📝 **Meeting Summary** — Concise 3-5 sentence overview of the entire meeting
- ✅ **Action Items** — Extracted tasks with owners and deadlines
- 📌 **Task List** — General tasks with priority levels (High / Medium / Low)
- 🎯 **Key Decisions** — Important decisions made, with rationale and expected impact
- 📄 **Full Transcript** — Searchable full text of the meeting
- 📋 **Copy & Download** — Export results as JSON or copy to clipboard
- 🔄 **Real-time Processing** — Animated progress steps during transcription and analysis

---

## 🏗️ Architecture

```
ai-meeting-assistant/
├── app.py                    # Flask backend (API routes, Whisper + GPT integration)
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
├── templates/
│   └── index.html            # Main UI (Jinja2 template)
└── static/
    ├── css/
    │   └── style.css         # Dark-theme responsive styles
    └── js/
        └── app.js            # Frontend logic (upload, fetch, render)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, Flask 3.0 |
| Transcription | OpenAI Whisper API (whisper-1) |
| LLM Analysis | OpenAI GPT-4o-mini |
| Frontend | Vanilla JS, HTML5, CSS3 |
| Styling | Custom dark theme with CSS variables |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### 1. Clone the repository

```bash
git clone https://github.com/PranayMahendrakar/ai-meeting-assistant.git
cd ai-meeting-assistant
```

### 2. Create virtual environment & install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

### 4. Run the application

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📖 How It Works

```
User uploads audio file
        ↓
Flask receives the file (POST /api/analyze)
        ↓
OpenAI Whisper API transcribes audio → full text transcript
        ↓
GPT-4o-mini analyzes transcript with structured prompt
        ↓
Returns JSON with: summary, action_items, tasks, key_decisions
        ↓
Frontend renders interactive result cards
```

---

## 🔌 API Reference

### POST /api/analyze

Upload audio for transcription and analysis.

**Request:** `multipart/form-data` with field `audio`

**Response:**
```json
{
  "success": true,
  "transcript": "Full meeting transcript text...",
  "analysis": {
    "summary": "The team discussed Q4 roadmap...",
    "action_items": [
      {
        "item": "Prepare Q4 presentation deck",
        "owner": "Sarah",
        "deadline": "Friday, Nov 15"
      }
    ],
    "tasks": [
      {
        "task": "Update API documentation",
        "priority": "High",
        "notes": "Needed before the release"
      }
    ],
    "key_decisions": [
      {
        "decision": "Adopt microservices architecture",
        "rationale": "Better scalability for future growth",
        "impact": "Requires 2-sprint migration effort"
      }
    ]
  }
}
```

### GET /api/health

Returns API status and key configuration state.

---

## 🎨 UI Features

- **Dark theme** with indigo/violet accent palette
- **Drag & drop** file upload with visual feedback
- **Animated processing** steps (Transcribing → Analyzing → Generating)
- **Stats bar** showing word count, action items, tasks, and decisions
- **Expandable transcript** accordion
- **Copy all** to clipboard button
- **Download** results as JSON
- Fully **responsive** (mobile friendly)

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `FLASK_ENV` | development / production | development |
| `FLASK_DEBUG` | Enable debug mode | 1 |
| `PORT` | Server port | 5000 |

---

## 🛡️ Supported Audio Formats

MP3, MP4, MPEG, MPGA, M4A, WAV, WebM, OGG, FLAC (max 100MB)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙌 Acknowledgements

- [OpenAI Whisper](https://openai.com/research/whisper) — Speech-to-text model
- [OpenAI GPT-4o-mini](https://openai.com/gpt-4) — Language model for analysis
- [Flask](https://flask.palletsprojects.com/) — Lightweight Python web framework
