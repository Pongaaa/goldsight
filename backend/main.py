from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://www.vang.today/api/prices"

# Danh sách loại vàng bạn cần
ALLOW_TYPES = {
    "XAUUSD",
    "SJL1L10",
    "SJ9999",
    "DOHNL",
    "BTSJC",
    "PQHNVM"
}

@app.get("/gia-vang")
def get_gold_prices():
    try:
        res = requests.get(API_URL, timeout=10)
        res.raise_for_status()
        data = res.json()

        # API này trả dạng dict { code: {...} }
        result = []

        for code, info in data.items():
            if code in ALLOW_TYPES:
                result.append({
                    "code": code,
                    "name": info.get("name"),
                    "buy": info.get("buy"),
                    "sell": info.get("sell"),
                    "updated_at": info.get("updated_at")
                })

        return {
            "source": "vang.today",
            "count": len(result),
            "data": result
        }

    except Exception as e:
        return {"error": str(e)}
