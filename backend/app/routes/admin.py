from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from ..extensions import db
from ..models import UserRole, User, Order, OrderItem, Inventory


admin_bp = Blueprint("admin", __name__)


def _require_admin(claims: dict):
    if not claims or claims.get("role") != UserRole.ADMIN.value:
        return {"error": "Forbidden"}, 403
    return None


@admin_bp.get("/stats")
@jwt_required()
def stats():
    claims = get_jwt()
    forbidden = _require_admin(claims)
    if forbidden:
        return forbidden
    num_farmers = db.session.query(func.count(User.id)).filter_by(role=UserRole.FARMER).scalar() or 0
    num_customers = db.session.query(func.count(User.id)).filter_by(role=UserRole.CUSTOMER).scalar() or 0
    total_sales = db.session.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    items_sold = db.session.query(func.coalesce(func.sum(OrderItem.quantity), 0)).scalar() or 0
    active_listings = db.session.query(func.count(Inventory.id)).filter_by(available=True).scalar() or 0

    # Monthly sales for last 6 months
    now = datetime.utcnow().replace(day=1)
    six_months_ago = (now - timedelta(days=31 * 5)).replace(day=1)
    sales_rows = (
        db.session.query(
            extract('year', Order.created_at).label('y'),
            extract('month', Order.created_at).label('m'),
            func.coalesce(func.sum(Order.total_amount), 0.0).label('total')
        )
        .filter(Order.created_at >= six_months_ago)
        .group_by('y', 'm')
        .order_by('y', 'm')
        .all()
    )
    monthly_sales = []
    for row in sales_rows:
        month_num = int(row.m)
        year_num = int(row.y)
        month_name = datetime(year_num, month_num, 1).strftime('%b')
        monthly_sales.append({"month": month_name, "year": year_num, "sales": float(row.total)})

    # Top crops in demand by quantity sold
    crop_rows = (
        db.session.query(Inventory.crop_name, func.coalesce(func.sum(OrderItem.quantity), 0).label('qty'))
        .join(OrderItem, OrderItem.inventory_id == Inventory.id)
        .group_by(Inventory.crop_name)
        .order_by(func.coalesce(func.sum(OrderItem.quantity), 0).desc())
        .limit(6)
        .all()
    )
    crops_in_demand = [dict(name=name, quantity=int(qty)) for name, qty in crop_rows]

    # Top farmers by sales
    farmer_rows = (
        db.session.query(
            User.name.label('name'),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.price), 0.0).label('sales'),
            func.count(func.distinct(OrderItem.order_id)).label('orders')
        )
        .join(Inventory, Inventory.farmer_id == User.id)
        .join(OrderItem, OrderItem.inventory_id == Inventory.id)
        .filter(User.role == UserRole.FARMER)
        .group_by(User.id, User.name)
        .order_by(func.coalesce(func.sum(OrderItem.quantity * OrderItem.price), 0.0).desc())
        .limit(5)
        .all()
    )
    top_farmers = [
        {"name": r.name, "sales": float(r.sales), "orders": int(r.orders)}
        for r in farmer_rows
    ]

    return {
        "numFarmers": int(num_farmers),
        "numCustomers": int(num_customers),
        "totalSales": float(total_sales),
        "itemsSold": int(items_sold),
        "activeListings": int(active_listings),
        "monthlySales": monthly_sales,
        "cropsInDemand": crops_in_demand,
        "topFarmers": top_farmers,
    }




    