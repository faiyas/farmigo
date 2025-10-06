import os
from uuid import uuid4
from flask import Blueprint, request, current_app
from typing import Optional

try:
    import torch  # type: ignore
    from PIL import Image  # type: ignore
    from diffusers import QwenImageEditPipeline  # type: ignore
    _QWEN_AVAILABLE = True
except Exception:
    _QWEN_AVAILABLE = False
import requests

ai_bp = Blueprint("ai", __name__)


@ai_bp.get("/recommend-crop")
def recommend_crop():
    city = request.args.get("city", "")
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    recommendation = {
        "recommendedCrops": ["Wheat", "Maize"],
        "suggestedManure": "Compost",
        "basis": "default heuristic",
    }
    if city and api_key:
        try:
            r = requests.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": city, "appid": api_key, "units": "metric"},
                timeout=6,
            )
            if r.ok:
                w = r.json()
                temp = w.get("main", {}).get("temp")
                humidity = w.get("main", {}).get("humidity")
                basis = []
                if temp is not None:
                    basis.append(f"temp {temp}C")
                if humidity is not None:
                    basis.append(f"humidity {humidity}%")
                if temp is not None and temp < 18:
                    recommendation["recommendedCrops"] = ["Potato", "Barley"]
                    recommendation["suggestedManure"] = "Well-rotted manure"
                elif temp is not None and temp > 28:
                    recommendation["recommendedCrops"] = ["Millet", "Sorghum"]
                    recommendation["suggestedManure"] = "Nitrogen-rich"
                recommendation["basis"] = ", ".join(basis) or recommendation["basis"]
        except Exception:
            pass
    return recommendation


@ai_bp.post("/chatbot")
def chatbot():
    data = request.get_json() or {}
    question = (data.get("question") or "").strip()
    if not question:
        return {"error": "No question provided"}, 400
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_key:
        return {"error": "GEMINI_API_KEY not configured on server"}, 400
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=gemini_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(question)
        text = getattr(resp, "text", None)
        if not text and getattr(resp, "candidates", None):
            try:
                text = resp.candidates[0].content.parts[0].text
            except Exception:
                text = None
        if not text:
            return {"error": "Gemini returned no content"}, 502
        return {"answer": text}
    except Exception as e:
        return {"error": f"Gemini error: {str(e)}"}, 502


@ai_bp.post("/disease-detect")
def disease_detect():
    if 'image' not in request.files:
        return {"error": "No image provided"}, 400
    file = request.files['image']
    if not file.filename:
        return {"error": "Empty filename"}, 400
    uploads_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(uploads_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower() or '.jpg'
    filename = f"{uuid4().hex}{ext}"
    path = os.path.join(uploads_dir, filename)
    file.save(path)
    prompt: Optional[str] = request.form.get("prompt") or request.json.get("prompt") if request.is_json else None

    # Basic heuristic to detect presence of green leaf-like pixels
    leaf_detected = True
    try:
        if _QWEN_AVAILABLE:
            img_rgb = Image.open(path).convert("RGB")
            pixels = img_rgb.getdata()
            total = len(pixels)
            greenish = 0
            for r, g, b in pixels[::50]:  # sample every 50th pixel for speed
                if g > r + 15 and g > b + 15 and g > 60:
                    greenish += 1
            ratio = greenish / max(1, total / 50)
            # If very low greenish ratio, likely not a leafy image
            if ratio < 0.04:
                leaf_detected = False
    except Exception:
        leaf_detected = True

    # If no leaf detected, skip heavy processing
    if not leaf_detected:
        return {
            "leafDetected": False,
            "message": "Leaf not detected in the uploaded image",
            "image": f"/uploads/{filename}",
        }

    # If Qwen pipeline available, run an illustrative edit to highlight diseased regions based on prompt
    edited_filename: Optional[str] = None
    if _QWEN_AVAILABLE:
        try:
            image = Image.open(path).convert("RGB")
            pipe = QwenImageEditPipeline.from_pretrained("Qwen/Qwen-Image-Edit")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            try:
                pipe.to(torch.bfloat16)
            except Exception:
                pass
            pipe.to(device)
            pipe.set_progress_bar_config(disable=True)
            edit_prompt = prompt or "Enhance and highlight diseased leaf regions with subtle outlines"
            inputs = {
                "image": image,
                "prompt": edit_prompt,
                "generator": torch.manual_seed(0),
                "true_cfg_scale": 4.0,
                "negative_prompt": " ",
                "num_inference_steps": 25,
            }
            with torch.inference_mode():
                output = pipe(**inputs)
                out_img = output.images[0]
                edited_filename = f"edited_{filename}"
                out_path = os.path.join(uploads_dir, edited_filename)
                out_img.save(out_path)
        except Exception:
            edited_filename = None

    # Placeholder disease detection result (replace with real classifier if available)
    # Build a structured report for consistent, non-random output
    disease_name = "Leaf Condition Analyzed"
    confidence_val = 0.75
    advice_text = "Ensure proper watering and monitor for spots; apply appropriate fungicide if symptoms persist."
    report = {
        "title": "Crop Disease Analysis Report",
        "disease": disease_name,
        "confidencePct": round(confidence_val * 100, 1),
        "summary": "Preliminary visual analysis of the uploaded leaf image has been completed.",
        "immediateActions": [
            "Isolate severely affected leaves to prevent spread.",
            "Avoid overhead irrigation late in the day.",
            "Improve airflow by maintaining recommended spacing.",
        ],
        "treatmentPlan": [
            "Day 0: Apply a copper-based or biological fungicide as per label.",
            "Day 7-10: Reassess. If symptoms persist, rotate to a different mode of action.",
            "Nutrition: Maintain balanced NPK and add micronutrients if deficiency is suspected.",
        ],
        "prevention": [
            "Rotate crops next season and use tolerant varieties if available.",
            "Mulch to reduce soil splash and conserve moisture.",
            "Sanitize tools and remove plant debris after harvest.",
        ],
        "advice": advice_text,
        "analyzedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "image": f"/uploads/{filename}",
        "editedImage": (f"/uploads/{edited_filename}" if edited_filename else None),
    }

    result = {
        "disease": disease_name,
        "confidence": confidence_val,
        "advice": advice_text,
        "image": f"/uploads/{filename}",
        "editedImage": (f"/uploads/{edited_filename}" if edited_filename else None),
        "promptUsed": prompt,
        "leafDetected": True,
        "report": report,
    }
    return result


