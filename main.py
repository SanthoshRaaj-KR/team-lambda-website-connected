from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests  

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/getData")
def get_data():
    try:
        # 🔹 Uncomment and set correct endpoint
        response = requests.get("http://10.29.118.218/getData", timeout=1)
        result = response.json()
        if result:
             return result
        pass
    except Exception as e:
        print(f"API fetch failed: {e}")

    # fallback
    return {
        "data": "TOF1:4000.5,TOF2:4500.75,ACCX:0.5,ACCY:-0.2,ACCZ:9.81,GYRX:0.17,GYRY:-0.65,GYRZ:0.22,DRIVE:1,BRUSH:0,DISORIENTED:0",
        "rssi": -119
    }
    