# [DIRECTIVE FOR VISUAL RENDERING PIPELINE & ANTIGRAVITY ENGINE]
# KÊNH PINTEREST: Aesthetic Haven Studio

## BỘ QUY CHUẨN THỊ GIÁC TỐI GIẢN (MINIMALIST VISUAL GUARDRAIL)
*Hiệu lực: Vĩnh viễn & Bắt buộc cho toàn bộ pipeline sinh ảnh, xử lý ảnh (PIL/Pillow/Blender/n8n/Canvas) xuất bản lên kênh Pinterest.*

---

### 1. LOẠI BỎ TOÀN BỘ CÁC LAYER ĐỒ HỌA THỪA (STRIP OVERLAYS)
- **CẤM:** Tuyệt đối không tạo khối nền đen/xám/trắng (dark/light card container, glassmorphic box) che 1/3 hay bất kỳ góc nào của ảnh.
- **CẤM:** Không lồng ảnh sản phẩm vào khung thẻ trắng (product card box) đặt đè lên ảnh nền.
- **CẤM:** Không tạo các nút bấm giả lập (như "EXPLORE SOURCEBOOK", "CHECK DEALS", "TAP HERE", "Tap to get the free guide"). Trên Pinterest cả tấm ảnh là một clickable link, việc vẽ nút bấm làm hạ cấp thẩm mỹ và vi phạm chính sách hiển thị tự nhiên.
- **CẤM:** Không chèn các khối text dài mô tả kỹ thuật (như "Architectural Quality & Tactile Finish...", phụ đề nhiều dòng, bullet points).
- **CẤM:** Không tạo viền khung (borders, framing lines, inner hairlines). Toàn bộ ảnh phải tràn viền 100%.

---

### 2. QUY CHUẨN KHUNG HÌNH (CANVAS & LAYOUT)
- **Tỷ lệ hiển thị:** 100% Full-bleed tràn viền dọc chuẩn **2:3 (1000 x 1500 px)** hoặc **9:16 (1080 x 1920 px)**.
- **Bảo toàn nhiếp ảnh gốc:** Giữ nguyên ảnh chụp thực tế (Lifestyle / In-use context) có chiều sâu, ánh sáng tự nhiên và khoảng thở (Negative Space).
- **Hero Focus:** Sản phẩm hoặc thao tác của con người (bàn tay, cử chỉ tương tác) phải là trung tâm thị giác duy nhất. Không có bất kỳ thành phần đồ họa nào được phép che khuất.

---

### 3. QUY ĐỊNH VỀ TEXT OVERLAY (NẾU CÓ)
- **Độ dài Hook:** Chỉ cho phép tối đa **01 dòng Hook ngắn (dưới 5 từ)**.
  - *Ví dụ chuẩn:* "Smart Kitchen Finds", "Aesthetic Countertop Setup", "Cozy Bedroom Sanctuary", "Minimalist Work Desk".
  - *Vi phạm:* Bất kỳ câu nào từ 5 từ trở lên hoặc nhiều hơn 1 dòng text.
- **Vị trí hiển thị:**
  - Đặt sát trong vùng **10% mép trên** (top margin: 5% - 10%) hoặc **10% mép dưới cùng** (bottom margin: 90% - 95%).
  - Tuyệt đối **KHÔNG** đè lên mặt người, bàn tay thao tác hoặc thân sản phẩm.
- **Typography & Styling:**
  - Font: Serif hoặc Sans-serif thanh lịch (Georgia, Cormorant, Playfair, Inter, Segoe UI).
  - Màu sắc: Đơn sắc Trắng (`#FFFFFF` / `rgb(255,255,255)`) hoặc Đen than (`#1A1A1A` / `rgb(26,26,26)`), tự động tương phản với nền.
  - Drop-shadow: Đổ bóng nhẹ `rgba(0, 0, 0, 0.3)` để chống chìm nền.
  - **TUYỆT ĐỐI KHÔNG DÙNG HỘP MÀU NỀN** (solid box, pill shape, rounded rectangle, badge container) đè sau chữ.

---

### 4. CƠ CHẾ REJECT & AUTO-GUARDRAIL
Mọi module render, script tạo ảnh hoặc workflow automation phát hiện:
- Có card box / container / overlay shape đè ảnh.
- Có nút bấm CTA giả lập.
- Có khối text dài > 4 từ hoặc che sản phẩm.
- Khung hình có viền hoặc không full-bleed.
-> **SẼ BỊ TỰ ĐỘNG REJECT VÀ BUILD LẠI THEO ĐÚNG BỘ QUY CHUẨN TRÊN.**
