# server.py
import os, io, json, base64
# from dotenv import load_dotenv
from flask import Flask, request, jsonify
from PIL import Image
import google.generativeai as genai

# Optional: HEIC/HEIF support if available
try:
    import pillow_heif  # noqa: F401
    # Register HEIF opener with Pillow if present
    try:
        pillow_heif.register_heif_opener()
    except Exception:
        pass
except Exception:
    pass

# =========================
# Setup
# =========================
# load_dotenv()

genai.configure(api_key="AIzaSyDlRBweyr4Rb71xRyMpVOGV0q3WHljzphg")

app = Flask(__name__)

# =========================
# Multi-issue classifier (Gemini)
# =========================
CATEGORIES = [
    "Manholes","Potholes","Garbage / Waste Dumps","Exposed Electrical Wires",
    "Streetlights Not Working","Stagnant Water","Drainage Leakage / Sewage Overflow",
    "Fallen Trees / Branches","Broken Pavement / Sidewalks","Construction Debris / Rubble",
    "Stray Animals / Dead Animals","Other"
]

SCENARIOS = """
Manholes:
- Low: partially open or misaligned cover at road edge
- Medium: fully uncovered manhole on road/footpath
- High: open manhole with water overflow OR in middle of busy road
Potholes:
- Low: small shallow pothole at road edge
- Medium: moderate pothole causing vehicles to slow/veer
- High: large deep pothole blocking lane, vehicles forced to stop/detour
Garbage / Waste Dumps:
- Low: small trash pile, single overflowing bin
- Medium: medium dump spreading on footpath, foul smell
- High: large dump blocking road, severe health hazard
Exposed Electrical Wires:
- Low: loose insulated wire away from people
- Medium: exposed live wire near shops/footpath
- High: live wire fallen on road/in water
Streetlights Not Working:
- Low: single light fused in well-lit area
- Medium: several lights out, street dim
- High: complete blackout in long stretch, risky
Stagnant Water:
- Low: small puddle after rain
- Medium: larger pool lasting days near shops/houses
- High: large stagnant pool with mosquitoes, foul smell
Drainage Leakage / Sewage Overflow:
- Low: minor leakage near drain
- Medium: sewage water flowing on road edge
- High: major overflow flooding road, pedestrians/vehicles disrupted
Fallen Trees / Branches:
- Low: small branch fallen, easy to avoid
- Medium: large branch blocking part of road/footpath
- High: uprooted tree blocking road, tangled with wires
Broken Pavement / Sidewalks:
- Low: minor cracks, not obstructive
- Medium: several slabs broken, risk of tripping
- High: large collapse, pedestrians forced onto road
Construction Debris / Rubble:
- Low: small pile neatly stacked at side
- Medium: debris spilling onto road/footpath
- High: large rubble pile blocking road/drain
Stray Animals / Dead Animals:
- Low: 1–2 strays loitering, not aggressive; small dead animal roadside
- Medium: pack of dogs/cattle blocking path; medium carcass with smell
- High: aggressive animals attacking, or large carcass blocking road
Other:
- Low: small nuisance (graffiti, litter)
- Medium: moderate obstruction or safety concern
- High: severe unusual hazard (fire, accident, collapse)
"""

SYSTEM_INSTRUCTION = f"""
You are a municipal field inspector.

Task:
- Inspect the input photo.
- Identify ALL distinct civic issues visible (0, 1, or many).
- Return STRICT JSON ONLY as an ARRAY of issue objects (no extra text).

Categories:
{CATEGORIES}

Each issue object must include:
- "category": one of the categories above
- "severity": "Low", "Medium", or "High"
- "description": 2–3 lines explaining the issue and severity rationale
- "confidence_percent": integer 0–100
- "bbox": optional normalized [x, y, width, height] in 0..1 (omit if unsure)

If there are no civic issues, return [].

Severity guidance:
{SCENARIOS}
"""

# Keep schema simple (SDK doesn't support minItems/maxItems etc.)
RESPONSE_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "category": {"type": "string"},
            "severity": {"type": "string", "enum": ["Low","Medium","High"]},
            "description": {"type": "string"},
            "confidence_percent": {"type": "number"},
            "bbox": {"type": "array", "items": {"type": "number"}}
        },
        "required": ["category","severity","description","confidence_percent"]
    }
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_INSTRUCTION,
    generation_config={
        "response_mime_type": "application/json",
        "response_schema": RESPONSE_SCHEMA
    }
)

# ---------- robust loader that works with jpg/jpeg/png/webp/heic/heif ----------
ALLOWED_DIRECT_MIMES = {
    # Let these pass through without recompressing if Pillow can't open
    "image/jpeg", "image/jpg", "image/png", "image/webp"
}
def file_to_inline_image(file_storage) -> dict:
    """
    Accept any common image format. Prefer sending original bytes + mime if it's a
    common web image; otherwise decode with Pillow and convert to JPEG.
    Falls back gracefully if anything goes wrong.
    """
    # Try to get the client-provided mimetype
    mime = (file_storage.mimetype or "").lower()

    # Read raw bytes (we may reuse them)
    file_storage.stream.seek(0)
    raw = file_storage.read()

    # If this looks like a common web image, try sending as-is first
    if mime in ALLOWED_DIRECT_MIMES and raw:
        try:
            # Quick sanity open; if it opens, we'll keep original mime
            Image.open(io.BytesIO(raw)).verify()
            b64 = base64.b64encode(raw).decode("utf-8")
            return {"inline_data": {"data": b64, "mime_type": ("image/jpeg" if mime == "image/jpg" else mime)}}
        except Exception:
            pass  # fallback to decode + re-encode

    # Decode with Pillow (handles PNG/WEBP; HEIC/HEIF if pillow-heif installed), then re-encode to JPEG
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()  # ensure it’s decoded
        if img.mode != "RGB":
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return {"inline_data": {"data": b64, "mime_type": "image/jpeg"}}
    except Exception:
        # Last resort: send raw bytes as JPEG mime (some odd formats may still work)
        b64 = base64.b64encode(raw).decode("utf-8")
        return {"inline_data": {"data": b64, "mime_type": "image/jpeg"}}

def _normalize_items(items):
    """Normalize confidence (0–1 → 0–100), clamp bbox to 0..1 (first 4 values)."""
    out = []
    for item in items:
        try:
            conf = float(item.get("confidence_percent"))
            if conf <= 1.0:
                conf *= 100.0
            item["confidence_percent"] = int(max(0, min(100, round(conf))))
        except Exception:
            item["confidence_percent"] = None

        if isinstance(item.get("bbox"), list) and item["bbox"]:
            try:
                item["bbox"] = [max(0.0, min(1.0, float(v))) for v in item["bbox"][:4]]
            except Exception:
                item["bbox"] = None
        out.append(item)
    return out

# -------- Route 1: Multi-issue classification --------
@app.route("/classify", methods=["POST"])
def classify_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    image_part = file_to_inline_image(request.files["image"])
    resp = model.generate_content(
        contents=[{"role":"user","parts":[
            {"text":"Analyze this image and list ALL distinct civic issues you find."}, image_part
        ]}]
    )

    if not getattr(resp, "text", None):
        return jsonify({"error": "Empty model response"}), 502

    try:
        data = json.loads(resp.text)
        if not isinstance(data, list):
            raise ValueError("Model did not return a JSON array.")
    except Exception:
        return jsonify({"error": "Model returned invalid JSON array", "raw": resp.text}), 502

    return jsonify(_normalize_items(data)), 200

# =========================
# Geohash (single point only)
# =========================
BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

def encode_geohash(lat: float, lon: float, precision: int = 7) -> str:
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("Latitude must be in [-90,90], longitude in [-180,180]")
    if not (1 <= precision <= 12):
        raise ValueError("precision must be in [1..12]")

    lat_min, lat_max = -90.0, 90.0
    lon_min, lon_max = -180.0, 180.0
    even, bit, ch = True, 0, 0
    out = []

    while len(out) < precision:
        if even:
            mid = (lon_min + lon_max) / 2.0
            if lon >= mid:
                ch = (ch << 1) | 1; lon_min = mid
            else:
                ch = (ch << 1);     lon_max = mid
        else:
            mid = (lat_min + lat_max) / 2.0
            if lat >= mid:
                ch = (ch << 1) | 1; lat_min = mid
            else:
                ch = (ch << 1);     lat_max = mid
        even = not even
        bit += 1
        if bit == 5:
            out.append(BASE32[ch]); bit = 0; ch = 0

    return "".join(out)

# -------- Route 2: Lats/long → geohash (single) --------
@app.route("/geohash", methods=["POST"])
def geohash_endpoint():
    """
    JSON input:
      { "lat": 17.33, "lon": 78.56, "precision": 7 }  # precision optional (default 6)
    """
    try:
        payload = request.get_json(force=True)
        lat = float(payload["lat"])
        lon = float(payload["lon"])
        precision = int(payload.get("precision", 6))
    except Exception as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400

    try:
        code = encode_geohash(lat, lon, precision)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"lat": lat, "lon": lon, "precision": precision, "geohash": code}), 200

# =========================
# Run
# =========================
if __name__ == "__main__":
    # Use a production WSGI server in prod
    app.run(host="0.0.0.0", port=5000, debug=True)
