from app import create_app
from app.extensions import db
from app.models import Crop


SEED_CROPS: list[tuple[str, str, str]] = [
    ("tomato", "Tomato", "Fresh red tomatoes"),
    ("potato", "Potato", "Organic potatoes"),
    ("wheat", "Wheat", "High quality wheat"),
]


def reset_and_seed_database() -> None:
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        for crop_code, name, description in SEED_CROPS:
            db.session.add(Crop(crop=crop_code, name=name, description=description))

        db.session.commit()
        print("Database reset complete. Seeded crops:", ", ".join([name for _, name, _ in SEED_CROPS]))


if __name__ == "__main__":
    reset_and_seed_database()


