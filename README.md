# Token Scam Checker Mini

Ứng dụng React nhỏ để kiểm tra nhanh token (BSC/Ethereum) bằng cách lấy source code từ BscScan/Etherscan và tìm các từ khóa nguy hiểm.

## Chạy trên máy:
1. Cài Node.js
2. Giải nén thư mục này
3. Trong thư mục project chạy:
   ```
   npm install
   npm start
   ```
4. Mở http://localhost:3000

## API keys
- Mở file src/App.js, thay `DEMO_BSCSCAN_KEY` và `DEMO_ETHERSCAN_KEY` bằng API key của bạn (tạo ở bscscan.com và etherscan.io).

## Lưu ý
- Đây là công cụ kiểm tra nhanh, không thay thế audit chuyên sâu.
