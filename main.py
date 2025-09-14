from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS etc.
    allow_headers=["*"],
)


@app.get("/getData")
def get_data():
    # Generate random float values with 2 decimal places
    T1 = round(random.uniform(5.0, 40.0), 2)
    T2 = round(random.uniform(5.0, 40.0), 2)
    AX = round(random.uniform(-500, 500), 2)
    AY = round(random.uniform(-500, 500), 2)
    AZ = round(random.uniform(-1000, 1000), 2)
    GX = round(random.uniform(-10, 10), 2)
    GY = round(random.uniform(-10, 10), 2)
    GZ = round(random.uniform(-10, 10), 2)
    C  = random.randint(0, 5000)

    # Build the same format string as your API
    data_str = f"T1:{T1} T2:{T2} AX:{AX} AY:{AY} AZ:{AZ} GX:{GX} GY:{GY} GZ:{GZ} C:{C}"
    
    # Random RSSI between -50 (strong) and -120 (weak)
    rssi = random.randint(-120, -50)

    return {
        "data": data_str,
        "rssi": rssi
    }