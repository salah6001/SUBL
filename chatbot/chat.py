import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai


# Load the apikey
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("Missing GEMINI_API_KEY in .env")


# the model
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    generation_config={
        "temperature": 0.2,
        "top_p": 0.8,
        "max_output_tokens": 1200,
    },
    system_instruction="""
You are SUBL, an assistant in a stress-monitoring web app.
Always finish your answers fully.
Do not cut off mid-sentence.
provide summarized short answers.

Your tasks:
- Explain stress insights clearly
- Give short ,semplified, practical stress-management tips
- Help users navigate the app

Context:
- The app estimates stress based on typing behavior
- Results are not fully accurate

Tone:
- Clear and concise
- Supportive but professional
- Do not assume stress unless stated

Rules:
- No medical advice or diagnosis
- Suggest professional help if user is in serious distress
- Prefer short actionable steps

Navigation:
- Dashboard: stress score, level, trends, emotions
- Articles: stress education
- Profile & Logout: user settings
"""
)


# Flask setup
app = Flask(__name__)
CORS(app)

# Simple memory + throttling
chat_history = []
MAX_HISTORY = 1

last_request_time = 0
THROTTLE_SECONDS = 3


# Quick actions mapping
def build_prompt(user_message):
    quick_actions = {
        "Help Me Relax": "User feels stressed. Provide short, practical relaxation techniques.",
        "Quick Stress Tips": "Give quick, actionable stress management tips.",
        "Why Am I Stressed": "Explain possible reasons for stress in a simple and relatable way.",
        "How To Focus Better": "Give practical advice to improve focus and reduce distractions.",
        "Explain My Results": "User has a stress score. Explain what it means and give advice.",
    }

    if user_message in quick_actions:
        return quick_actions[user_message]

    return user_message


# Health check (used by docker / load balancers)
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# Chat endpoint
@app.route("/chat", methods=["POST"])
def chat():
    global last_request_time, chat_history

    try:
        # -------- Throttling --------
        current_time = time.time()
        if current_time - last_request_time < THROTTLE_SECONDS:
            return jsonify({"reply": "Please wait a few seconds before sending another message."}), 429

        last_request_time = current_time

        # -------- Get input --------
        data = request.json
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"reply": "Please enter a valid message."}), 400

        # Build prompt
        prompt = build_prompt(user_message)

        # Add to memory
        chat_history.append(f"User: {prompt}")
        if len(chat_history) > MAX_HISTORY:
            chat_history.pop(0)

        context = "\n".join(chat_history)

        # Gemini call
        response = model.generate_content(context)

        reply_text = response.text.strip()
        # Store assistant reply
        chat_history.append(f"Assistant: {reply_text}")
        if len(chat_history) > MAX_HISTORY:
            chat_history.pop(0)

        # Return response
        return jsonify({"reply": reply_text})

    except Exception:
        return jsonify({"reply": "Something went wrong. Please try again."}), 500


# Run server
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
