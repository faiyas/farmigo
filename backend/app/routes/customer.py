from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import Inventory, Crop, Order, OrderItem, UserRole


customer_bp = Blueprint("customer", __name__)


@customer_bp.get("/market")
def market():
    search = request.args.get('search', '').strip().lower()
    query = Inventory.query.filter_by(available=True)
    
    if search:
        query = query.filter(Inventory.crop_name.ilike(f'%{search}%'))
    
    items = query.all()
    return {
        "items": [
            {
                "id": i.id,
                "crop": {"id": None, "name": i.crop_name},
                "price": i.price,
                "quantity": i.quantity,
                "farmerId": i.farmer_id,
                "imageUrl": i.image_url,
            }
            for i in items
        ]
    }


@customer_bp.post("/orders")
@jwt_required()
def create_order():
    claims = get_jwt()
    if claims.get("role") not in [UserRole.CUSTOMER.value, UserRole.ADMIN.value]:
        return {"error": "Forbidden"}, 403
    data = request.get_json() or {}
    items = data.get("items", [])
    if not items:
        return {"error": "No items"}, 400
    total = 0.0
    prepared: list[tuple[Inventory, int]] = []
    for entry in items:
        inv = Inventory.query.filter_by(id=entry.get("inventoryId"), available=True).first()
        qty = int(entry.get("quantity", 0))
        if not inv or qty <= 0 or inv.quantity < qty:
            return {"error": "Invalid item or insufficient stock"}, 400
        total += inv.price * qty
        prepared.append((inv, qty))
    order = Order(customer_id=int(get_jwt_identity()), total_amount=total)
    db.session.add(order)
    db.session.flush()
    for inv, qty in prepared:
        db.session.add(OrderItem(order_id=order.id, inventory_id=inv.id, quantity=qty, price=inv.price))
        inv.quantity -= qty
        if inv.quantity == 0:
            inv.available = False
    db.session.commit()
    return {"orderId": order.id, "total": total}, 201


