from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

@app.get("/gia-vang")
def get_gold():
    try:
        with open("gold_data.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"error": "No data yet"}
