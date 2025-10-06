from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import Inventory, Crop, UserRole
import os
from werkzeug.utils import secure_filename
from typing import Optional


farmer_bp = Blueprint("farmer", __name__)


def _require_role(role: UserRole, claims: dict):
    if not claims or claims.get("role") != role.value:
        return {"error": "Forbidden"}, 403
    return None


@farmer_bp.get("/inventory")
@jwt_required()
def list_inventory():
    claims = get_jwt()
    forbidden = _require_role(UserRole.FARMER, claims)
    if forbidden:
        return forbidden
    user_id = int(get_jwt_identity())
    items = Inventory.query.filter_by(farmer_id=user_id).all()
    return {
        "items": [
            {
                "id": i.id,
                "crop": {"id": None, "name": i.crop_name},
                "price": i.price,
                "quantity": i.quantity,
                "available": i.available,
                "imageUrl": i.image_url,
            }
            for i in items
        ]
    }


@farmer_bp.get("/crops")
@jwt_required(optional=True)
def list_crops():
    crops = Crop.query.order_by(Crop.name.asc()).all()
    return {"crops": [{"id": None, "crop": c.crop, "name": c.name, "description": c.description} for c in crops]}


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _save_upload(file_storage) -> Optional[str]:
    if not file_storage or file_storage.filename == "":
        return None
    if not _allowed_file(file_storage.filename):
        return None
    filename = secure_filename(file_storage.filename)
    from flask import current_app
    upload_dir = current_app.config.get("UPLOAD_FOLDER")
    os.makedirs(upload_dir, exist_ok=True)
    dest = os.path.join(upload_dir, filename)
    # ensure unique
    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(dest):
        filename = f"{base}_{counter}{ext}"
        dest = os.path.join(upload_dir, filename)
        counter += 1
    file_storage.save(dest)
    return f"/uploads/{filename}"


@farmer_bp.post("/inventory")
@jwt_required()
def create_inventory():
    claims = get_jwt()
    forbidden = _require_role(UserRole.FARMER, claims)
    if forbidden:
        return forbidden

    # Support both JSON and multipart
    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form
        crop_name = (form.get("cropName") or "").strip()
        price = form.get("price", type=float)
        quantity = form.get("quantity", type=int)
        image_url = _save_upload(request.files.get("image"))
    else:
        data = request.get_json() or {}
        crop_name = (data.get("cropName") or "").strip()
        price = data.get("price")
        quantity = data.get("quantity")
        image_url = data.get("imageUrl")

    if price is None or quantity is None:
        return {"error": "Missing fields"}, 400

    if not crop_name:
        return {"error": "Provide cropName"}, 400

    item = Inventory(
        farmer_id=int(get_jwt_identity()),
        crop_name=crop_name,
        price=price,
        quantity=quantity,
        image_url=image_url,
    )
    db.session.add(item)
    db.session.commit()
    return {"id": item.id, "imageUrl": item.image_url}, 201


@farmer_bp.put("/inventory/<int:item_id>")
@jwt_required()
def update_inventory(item_id: int):
    claims = get_jwt()
    forbidden = _require_role(UserRole.FARMER, claims)
    if forbidden:
        return forbidden
    item = Inventory.query.filter_by(id=item_id, farmer_id=int(get_jwt_identity())).first()
    if not item:
        return {"error": "Not found"}, 404

    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form
        if "price" in form:
            item.price = form.get("price", type=float)
        if "quantity" in form:
            item.quantity = form.get("quantity", type=int)
        if "available" in form:
            item.available = bool(int(form.get("available"))) if form.get("available").isdigit() else bool(form.get("available"))
        new_url = _save_upload(request.files.get("image"))
        if new_url:
            item.image_url = new_url
    else:
        data = request.get_json() or {}
        if "price" in data:
            item.price = data["price"]
        if "quantity" in data:
            item.quantity = data["quantity"]
        if "available" in data:
            item.available = bool(data["available"])
        if "imageUrl" in data:
            item.image_url = data["imageUrl"]
    db.session.commit()
    return {"status": "updated", "imageUrl": item.image_url}


@farmer_bp.delete("/inventory/<int:item_id>")
@jwt_required()
def delete_inventory(item_id: int):
    claims = get_jwt()
    forbidden = _require_role(UserRole.FARMER, claims)
    if forbidden:
        return forbidden
    item = Inventory.query.filter_by(id=item_id, farmer_id=int(get_jwt_identity())).first()
    if not item:
        return {"error": "Not found"}, 404
    db.session.delete(item)
    db.session.commit()
    return {"status": "deleted"}


