import React, { useState } from "react";
import "./App.css";

function App() {
  const [address, setAddress] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // 🔍 Hàm đoán chain tự động
  const detectChain = (address) => {
    if (address.startsWith("0x")) return "bsc"; // tạm mặc định là BSC
    return "eth";
  };

  // ⚙️ Phân tích mã nguồn (như cũ)
  const scanSource = (code) => {
    if (!code) return;

    const checks = {
      "Trap / Lock Sell": {
        code: /_mode|setMode|MODE_TRANSFER|revert\(/i.test(code)
          ? "Có khả năng trap hoặc giới hạn bán"
          : "Không phát hiện trap trực tiếp",
        reality: /handler|limitSell|antiBot/i.test(code)
          ? "Có xử lý trước khi bán, cần kiểm tra mục đích (anti-bot hay trap)"
          : "Không có logic trap trong giao dịch",
      },
      Blacklist: {
        code: /(blacklist|isBlacklisted)/i.test(code)
          ? "Phát hiện cơ chế blacklist trong code"
          : "Không có blacklist",
        reality: /(removeFromBlacklist|clearBlacklist)/i.test(code)
          ? "Có cơ chế gỡ blacklist → ít rủi ro"
          : "Không có cơ chế gỡ blacklist → có thể khóa ví vĩnh viễn",
      },
      "Tax / Fee": {
        code: /(setFee|takeFee|_tax|feeDenominator|updateFee)/i.test(code)
          ? "Có thể chỉnh thuế hoặc phí giao dịch"
          : "Không phát hiện điều chỉnh thuế",
        reality: /(maxFee|limit|<=3%|require\(fee <)/i.test(code)
          ? "Giới hạn mức thuế hợp lý → minh bạch"
          : "Không có giới hạn thuế → có thể tăng cao tùy ý",
      },
      "Owner Control": {
        code: /(onlyOwner|renounceOwnership|transferOwnership)/i.test(code)
          ? "Phát hiện quyền Owner trong code"
          : "Không có onlyOwner",
        reality: /(multiSig|timelock)/i.test(code)
          ? "Multi-sig hoặc timelock → ít rủi ro"
          : "Chưa thấy multi-sig → kiểm tra quyền kiểm soát cá nhân",
      },
      "Before Transfer Hook": {
        code: /(_beforeTokenTransfer|_transfer)/i.test(code)
          ? "Có beforeTransfer hook"
          : "Không có beforeTransfer",
        reality: /(event|marketing|distribute)/i.test(code)
          ? "Hook dùng cho event/phân phối → an toàn"
          : "Hook có thể can thiệp giao dịch → cần xem chi tiết",
      },
      Mint: {
        code: /(mint|_mint)/i.test(code)
          ? "Có khả năng mint thêm token"
          : "Không phát hiện mint",
        reality: /(maxSupply|fixed)/i.test(code)
          ? "Đã giới hạn supply → an toàn"
          : "Không thấy maxSupply → có thể mở rộng nguồn cung",
      },
    };

    setResult(checks);
  };

  // ⚡ Gọi API backend /api/getSource.js
  const checkToken = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const chain = detectChain(address);

    try {
      const res = await fetch(`/api/getSource?address=${address}&chain=${chain}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSourceCode(data.source);
      scanSource(data.source);
    } catch (err) {
      setError("Lỗi khi kiểm tra: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasteCheck = () => {
    if (!sourceCode) return;
    scanSource(sourceCode);
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#0f172a",
        minHeight: "100vh",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Token Scam Checker PRO ⚡</h1>
        <p style={{ color: "#9ca3af" }}>Kiểm tra nhanh dấu hiệu rủi ro trong smart contract.</p>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ token (0x...)"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #334155",
            }}
          />
          <button
            onClick={checkToken}
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
            }}
          >
            {loading ? "Đang kiểm tra..." : "Kiểm tra"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: "#7f1d1d", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label htmlFor="pasteSource">Hoặc dán source code:</label>
          <textarea
            id="pasteSource"
            rows={10}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            style={{
              width: "100%",
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#fff",
            }}
          />
          <button
            onClick={handlePasteCheck}
            style={{
              marginTop: 8,
              padding: "10px 16px",
              borderRadius: 8,
              background: "#16a34a",
              color: "#fff",
              border: "none",
            }}
          >
            Check source code
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 22, marginBottom: 12 }}>📊 Kết quả phân tích chi tiết</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                background: "#1e293b",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 12, fontWeight: "bold", background: "#0f172a" }}>Tiêu chí</div>
              <div style={{ padding: 12, fontWeight: "bold", background: "#0f172a" }}>Phân tích từ code</div>
              <div style={{ padding: 12, fontWeight: "bold", background: "#0f172a" }}>Nhận định thực tế</div>

              {Object.entries(result).map(([key, val]) => (
                <React.Fragment key={key}>
                  <div style={{ padding: 12, borderTop: "1px solid #334155" }}>{key}</div>
                  <div style={{ padding: 12, borderTop: "1px solid #334155", color: "#fbbf24" }}>
                    {val.code}
                  </div>
                  <div
                    style={{
                      padding: 12,
                      borderTop: "1px solid #334155",
                      color: val.reality.includes("rủi ro") ? "#f87171" : "#a5f3fc",
                    }}
                  >
                    {val.reality}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p style={{ marginTop: 12, color: "#94a3b8" }}>
              ⚠️ Công cụ phân tích nhanh, không thay thế audit chuyên sâu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
