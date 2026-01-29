# crawler.py
from bs4 import BeautifulSoup
import re, time, json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def parse_price_data(raw_text):
    if not raw_text: return {"price": 0, "change": "", "trend": "flat"}
    price_match = re.search(r"^([\d,.]+)", raw_text)
    clean_price = int(price_match.group(1).replace(',', '').replace('.', '')) if price_match else 0
    change_match = re.search(r"([▲▼][\d,.]+[Kk]?)", raw_text)
    trend, change_text = "flat", ""
    if change_match:
        change_text = change_match.group(1)
        trend = "up" if "▲" in change_text else "down"
    return {"price": clean_price, "change": change_text, "trend": trend}

def crawl_gold():
    url = "https://giavangvietnam.com/"
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    driver.get(url)
    time.sleep(5)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    tables = soup.find_all("table")
    table = tables[0]

    data = []
    now = datetime.now().strftime("%H:%M:%S")

    for row in table.find_all("tr")[1:]:
        cols = row.find_all("td")
        if len(cols) >= 3:
            data.append({
                "brand": cols[0].get_text(strip=True),
                "buy": parse_price_data(cols[1].get_text(strip=True)),
                "sell": parse_price_data(cols[2].get_text(strip=True)),
                "updated_at": now
            })

    with open("gold_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

if __name__ == "__main__":
    crawl_gold()
