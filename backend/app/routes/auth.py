from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import User, UserRole

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    required = [data.get("name"), data.get("email"), data.get("password")]
    if not all(required):
        return {"error": "Missing fields"}, 400
    try:
        role = UserRole(data.get("role", UserRole.CUSTOMER))
        user = User(name=data["name"], email=data["email"], role=role)
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
        return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value}}
    except IntegrityError:
        db.session.rollback()
        return {"error": "Email already registered"}, 409
    except Exception as e:
        db.session.rollback()
        return {"error": f"Registration error: {str(e)}"}, 400


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not all([email, password]):
        return {"error": "Missing fields"}, 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid credentials"}, 401
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value}}


