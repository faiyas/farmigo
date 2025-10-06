
import os
from dotenv import load_dotenv  # type: ignore
from flask import Flask, jsonify
from app import create_app

# Load environment variables from backend/.env if present
ENV_PATH = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)

os.makedirs(os.path.join(os.path.dirname(__file__), 'uploads'), exist_ok=True)

# Create the Flask application instance
app = create_app()

# Add catch-all route for testing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({
        "message": "Hello from your Python backend!",
        "path_visited": f"/{path}",
        "author": "Faiyas"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


