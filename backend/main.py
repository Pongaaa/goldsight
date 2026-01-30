from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://www.vang.today/api/prices"

# DANH SÁCH MÃ VÀNG BẠN CẦN (Lưu ý: Đã cập nhật đúng tên mã từ ảnh bạn gửi)
ALLOW_TYPES = {
    "XAUUSD",   # Vàng thế giới
    "SJL1L10",  # SJC 1 lượng - 10 lượng
    "SJ9999",   # Nhẫn SJC 9999
    "DOHNL",    # DOJI Hà Nội Lẻ
    "BTSJC",    # Bảo Tín SJC
    "PQHNVM"    # PNJ Hà Nội Vàng miếng (Kiểm tra lại mã này nếu không thấy)
}

@app.get("/")
def root():
    return {"status": "ok", "service": "gold-price-api"}

@app.get("/gia-vang")
def get_gold_prices():
    # --- BÍ KÍP VƯỢT TƯỜNG LỬA ---
    # Headers này giả lập bạn là người dùng Chrome trên Windows 10
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.vang.today/",
        "Origin": "https://www.vang.today",
        "Connection": "keep-alive"
    }
    
    try:
        # Gọi API với headers "xịn"
        res = requests.get(API_URL, headers=headers, timeout=15)
        res.raise_for_status()
        
        raw_data = res.json()
        
        # Xử lý linh hoạt cả 2 trường hợp cấu trúc dữ liệu
        items_list = []
        if isinstance(raw_data, dict):
            # Nếu trả về { "success": true, "data": [...] }
            items_list = raw_data.get("data", [])
        elif isinstance(raw_data, list):
            # Nếu trả về trực tiếp [...]
            items_list = raw_data

        result = []
        # Lưu lại danh sách mã tìm thấy để debug
        found_codes = [] 

        for item in items_list:
            # Lấy code, ưu tiên key 'type_code' theo tài liệu
            code = item.get("type_code") or item.get("code")
            
            if code:
                found_codes.append(code)

            if code in ALLOW_TYPES:
                result.append({
                    "code": code,
                    "name": item.get("type_code"), 
                    "buy": item.get("buy"),
                    "sell": item.get("sell"),
                    "updated_at": item.get("update_time")
                })

        # --- LOGIC KIỂM TRA KẾT QUẢ ---
        if not result and len(found_codes) > 0:
            return {
                "status": "warning",
                "message": "Kết nối thành công nhưng không khớp mã nào trong ALLOW_TYPES.",
                "suggestion": "Hãy kiểm tra lại danh sách ALLOW_TYPES của bạn.",
                "available_codes_from_api": found_codes[:10] # Gợi ý 10 mã đầu tiên tìm thấy
            }
        elif not result and len(found_codes) == 0:
             return {
                "status": "error",
                "message": "API trả về danh sách rỗng. Có thể IP bị chặn hoặc cần Cookies.",
                "raw_response": raw_data
            }

        return {
            "source": "vang.today",
            "count": len(result),
            "data": result
        }

    except Exception as e:
        print(f"Lỗi: {str(e)}")
        return {
            "error": "Lỗi kết nối server",
            "details": str(e)
        }