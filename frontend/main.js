
// --- CẤU HÌNH ---
const API_URL = "https://goldsight-jwvk.onrender.com/gia-vang";

const formatMoney = (price, currency = 'VND') => {
    if (!price) return "N/A";
    const options = currency === 'USD' 
        ? { style: 'currency', currency: 'USD' } 
        : { style: 'currency', currency: 'VND' };
    return new Intl.NumberFormat('vi-VN', options).format(price);
}

const getTrendHtml = (change) => {
    if (!change || change === 0) return '';
    const isUp = change > 0;
    const colorClass = isUp ? 'text-green-500' : 'text-red-500';
    const bgClass = isUp ? 'bg-green-500/10' : 'bg-red-500/10';
    const icon = isUp ? '▲' : '▼';
    const formattedChange = formatMoney(Math.abs(change)).replace('₫','').trim();
    return `<span class="${colorClass} ${bgClass} text-[10px] ml-2 px-1 rounded font-bold inline-block">${icon} ${formattedChange}</span>`;
}

// --- HÀM MỚI: TẠO NHẬN ĐỊNH AI DỰA TRÊN VNGSJC ---
function updateAIAnalysis(item) {
    const container = document.getElementById("ai-analysis-container");
    if (!item || !container) return;

    const trend = item.change_sell || 0;
    const spread = item.sell - item.buy;
    
    // Logic tạo câu văn tự động (AI Writer)
    let trendText = "";
    let adviceText = "";
    let iconTrend = "";

    if (trend >= 500000) {
        iconTrend = "<span class='text-green-500 font-bold'>tăng trưởng</span>";
        trendText = `Thị trường hiện tại ghi nhận tín hiệu tích cực khi giá vàng trong nước đang tăng <strong>${formatMoney(trend)}</strong> so với phiên trước.`;
        adviceText = "Xu hướng tăng đang chiếm ưu thế. Dòng tiền đang có dấu hiệu quay trở lại, nhà đầu tư ngắn hạn có thể cân nhắc vị thế mua lướt sóng.";
    } else if (trend <= -500000) {
        iconTrend = "<span class='text-red-500 font-bold'>điều chỉnh giảm</span>";
        trendText = `Thị trường đang chịu áp lực chốt lời khiến giá vàng trong nước giảm nhẹ <strong>${formatMoney(Math.abs(trend))}</strong>.`;
        adviceText = "Đây là nhịp điều chỉnh cần thiết để thị trường cân bằng. Có thể xem xét tích lũy cho mục tiêu dài hạn.";
    } else {
        iconTrend = "<span class='text-yellow-500 font-bold'>đi ngang</span>";
        trendText = `Thị trường đang trong giai đoạn tích lũy, giá vàng trong nước hầu như không biến động nhiều so với phiên trước.`;
        adviceText = "Thị trường chưa xác định rõ xu hướng bứt phá. Nhà đầu tư nên thận trọng quan sát thêm trước khi ra quyết định giải ngân lớn.";
    }

    // Tạo nội dung HTML
    const htmlContent = `
        <p>
            Dữ liệu thời gian thực ghi nhận giá bán ra của giá vàng trong nước ở mức <strong class="text-white text-lg">${formatMoney(item.sell)}</strong>. 
            Biên độ chênh lệch mua - bán đang duy trì ở mức <strong>${formatMoney(spread)}</strong>.
        </p>
        <p>
            ${trendText} Diễn biến này cho thấy thị trường đang ${iconTrend} trong ngắn hạn.
        </p>
        <div class="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mt-4">
            <strong class="text-yellow-400 block mb-1">
                <i class="fa-solid fa-lightbulb mr-2"></i>Khuyến nghị AI:
            </strong>
            ${adviceText}
        </div>
    `;

    container.innerHTML = htmlContent;
}

async function fetchPrices() {
    try {
        // Thêm timestamp để tránh cache trình duyệt
        const res = await fetch(API_URL + "?t=" + new Date().getTime());
        const jsonData = await res.json();

        let pricesObj = {};
        
        if (jsonData.raw_response && jsonData.raw_response.prices) {
            pricesObj = jsonData.raw_response.prices;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
            jsonData.data.forEach(item => {
                pricesObj[item.code] = item;
            });
        }

        // 1. CẬP NHẬT GIÁ VÀNG THẾ GIỚI
        const worldGold = pricesObj["XAUUSD"];
        if (worldGold) {
            const priceStr = formatMoney(worldGold.buy, 'USD').replace('US$', '').trim();

            // 2. Chèn lại HTML: Số tiền giữ nguyên, chữ US$ nằm trong thẻ span riêng
            document.getElementById("xauusd-price").innerHTML = `
                ${priceStr}
                <span class="text-3xl text-white font-bold -ml-2 relative top-2">US$</span>
            `;
            
            const change = worldGold.change_buy || 0;
            const changeColor = change >= 0 ? 'text-green-500' : 'text-red-500';
            const changeIcon = change >= 0 ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '<i class="fa-solid fa-arrow-trend-down"></i>';
            
            document.getElementById("xauusd-change").innerHTML = `
                <span class="${changeColor} bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                    ${changeIcon} ${change.toFixed(2)} USD
                </span>
            `;
            const timeUpdate = jsonData.raw_response ? (jsonData.raw_response.time + " " + jsonData.raw_response.date) : "Vừa xong";
            document.getElementById("xauusd-time").innerText = "Cập nhật lúc: " + timeUpdate;
        }

        // 2. CẬP NHẬT NHẬN ĐỊNH AI (Dùng mã VNGSJC)
        const vngItem = pricesObj["VNGSJC"]; // Lấy đúng mã VNGSJC từ API
        if (vngItem) {
            updateAIAnalysis(vngItem);
        }

        // 3. CẬP NHẬT BẢNG GIÁ
        const tbody = document.getElementById("gold-table");
        tbody.innerHTML = "";

        Object.entries(pricesObj).forEach(([code, item]) => {
            if (code === 'XAUUSD' || !item.name) return;

            const buyTrend = getTrendHtml(item.change_buy);
            const sellTrend = getTrendHtml(item.change_sell);
            const spread = (item.sell - item.buy);

            const row = `
            <tr class="hover:bg-gray-800/50 transition duration-200 border-b border-gray-800/50 last:border-0">
                <td class="p-3">
                    <div class="font-bold text-white text-base">${item.name}</div>
                    <div class="text-gray-500 text-xs font-mono mt-0.5">${code}</div>
                </td>
                <td class="p-3 text-right font-mono text-white">
                    ${formatMoney(item.buy)}
                    <div class="mt-0.5">${buyTrend}</div>
                </td>
                <td class="p-3 text-right font-mono text-white">
                    ${formatMoney(item.sell)}
                    <div class="mt-0.5">${sellTrend}</div>
                </td>
                <td class="p-3 text-right font-mono text-gray-400 text-sm">
                    ${formatMoney(spread)}
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Lỗi:", error);
        document.getElementById("xauusd-time").innerText = "Đang tải dữ liệu...";
    }
}

fetchPrices();
setInterval(fetchPrices, 60000); // 60s cập nhật 1 lần