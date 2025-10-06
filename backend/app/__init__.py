from flask import Flask
from .config import Config
from .extensions import db, jwt, cors, migrate
from flask_cors import CORS
from flask import send_from_directory
import os
from dotenv import load_dotenv  # type: ignore


def create_app(config_class: type = Config) -> Flask:
    # Load environment from backend/.env to ensure keys like GEMINI_API_KEY are available
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if os.path.exists(env_path):
        load_dotenv(env_path)

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for frontend domains
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",  # Vite dev server
                "http://localhost:3000",   # Alternative local development
                "https://farmigo.vercel.app",  # Production frontend URL
                "https://farmigo25.netlify.app"  # Alternative production URL
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})
    CORS(app, origins=["http://localhost:8080"])

    from .routes.auth import auth_bp
    from .routes.farmer import farmer_bp
    from .routes.customer import customer_bp
    from .routes.admin import admin_bp
    from .routes.ai import ai_bp

    # Ensure tables exist (fallback if migrations not run)
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            pass

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(farmer_bp, url_prefix="/api/farmer")
    app.register_blueprint(customer_bp, url_prefix="/api/customer")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    @app.get("/uploads/<path:filename>")
    def uploads(filename: str):
        upload_dir = app.config.get("UPLOAD_FOLDER")
        return send_from_directory(upload_dir, filename)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


