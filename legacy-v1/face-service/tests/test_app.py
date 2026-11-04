"""pytest for face-service. Run: .venv/bin/pytest tests"""

import io

from fastapi.testclient import TestClient
from PIL import Image

import app as face_app

client = TestClient(face_app.app)


def png_bytes(color=(255, 255, 255), size=(200, 200)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_blank_image_has_no_faces():
    res = client.post("/embed", files={"image": ("blank.png", png_bytes(), "image/png")})
    assert res.status_code == 200
    assert res.json() == {"faces": []}


def test_large_body_rejected():
    big = b"0" * (face_app.MAX_BODY_BYTES + 1)
    res = client.post("/embed", files={"image": ("big.jpg", big, "image/jpeg")})
    assert res.status_code == 413
