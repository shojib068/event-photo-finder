"""face-service: stateless face detection + ArcFace embeddings.

Images are processed in memory only. Nothing is written to disk or logged.
Bind to 127.0.0.1 so only the app and worker can reach it.
"""

import io
import os

import numpy as np
from fastapi import FastAPI, HTTPException, Request, UploadFile
from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:  # HEIC support is optional
    pass

MAX_BODY_BYTES = 20 * 1024 * 1024
MAX_LONG_EDGE = 1600
MODEL_NAME = "buffalo_l"

app = FastAPI(title="face-service")
_model = None


def get_model():
    global _model
    if _model is None:
        from insightface.app import FaceAnalysis

        providers = os.environ.get("FACE_ONNX_PROVIDERS", "CPUExecutionProvider").split(",")
        model = FaceAnalysis(name=MODEL_NAME, providers=providers)
        model.prepare(ctx_id=-1, det_size=(640, 640))
        _model = model
    return _model


@app.on_event("startup")
def load_model() -> None:
    if os.environ.get("FACE_SERVICE_LAZY") != "1":
        get_model()


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and int(length) > MAX_BODY_BYTES:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=413, content={"error": "too_large"})
    return await call_next(request)


def decode_image(data: bytes) -> tuple[np.ndarray, float]:
    """Decode, apply EXIF rotation, downsize. Returns (BGR array, scale back to original px)."""
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img).convert("RGB")
    long_edge = max(img.size)
    if long_edge > MAX_LONG_EDGE:
        scale = MAX_LONG_EDGE / long_edge
        img = img.resize((round(img.width * scale), round(img.height * scale)))
    rgb = np.asarray(img)
    return rgb[:, :, ::-1].copy(), scale_factor(long_edge)


def scale_factor(long_edge: int) -> float:
    return long_edge / MAX_LONG_EDGE if long_edge > MAX_LONG_EDGE else 1.0


def to_face_json(face, scale: float) -> dict:
    x1, y1, x2, y2 = (float(v) * scale for v in face.bbox)
    emb = face.normed_embedding.astype(float).tolist()
    return {
        "embedding": emb,
        "bbox": [x1, y1, x2 - x1, y2 - y1],
        "det_score": float(face.det_score),
    }


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": MODEL_NAME}


@app.post("/embed")
async def embed(image: UploadFile) -> dict:
    data = await image.read()
    if len(data) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="too_large")
    try:
        bgr, scale = decode_image(data)
    except Exception:
        raise HTTPException(status_code=400, detail="bad_image")
    finally:
        del data
    faces = get_model().get(bgr)
    return {"faces": [to_face_json(f, scale) for f in faces]}
