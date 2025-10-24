import React, { useState } from "react";
import "./App.css";

function App() {
  const [address, setAddress] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const scanSource = (code) => {
    if (!code) return;
    const checks = {
      "Trap / Lock Sell": {
        code: /_mode|setMode|revert\(/i.test(code)
          ? "Có khả năng trap hoặc giới hạn bán"
          : "Không phát hiện trap trực tiếp",
        reality: /limitSell|antiBot/i.test(code)
          ? "Có xử lý trước khi bán (cần kiểm tra anti-bot/trap)"
          : "Không có logic trap rõ ràng",
      },
      "Blacklist": {
        code: /(blacklist|isBlacklisted)/i.test(code)
          ? "Phát hiện blacklist trong code"
          : "Không có blacklist",
        reality: /(removeFromBlacklist|clearBlacklist)/i.test(code)
          ? "Có cơ chế gỡ blacklist → ít rủi ro"
          : "Không có cơ chế gỡ blacklist → có thể khóa ví vĩnh viễn",
      },
      "Tax / Fee": {
        code: /(setFee|takeFee|_tax|feeDenominator)/i.test(code)
          ? "Có thể chỉnh thuế/phí giao dịch"
          : "Không có code điều chỉnh thuế",
        reality: /(maxFee|require\(fee <)/i.test(code)
          ? "Giới hạn thuế hợp lý"
          : "Không giới hạn thuế → có thể tùy ý tăng",
      },
      "Owner Control": {
        code: /(onlyOwner|renounceOwnership|transferOwnership)/i.test(code)
          ? "Phát hiện quyền Owner"
          : "Không có onlyOwner",
        reality: /(multiSig|timelock)/i.test(code)
          ? "Multi-sig/timelock → an toàn"
          : "Không thấy timelock → kiểm tra kỹ quyền kiểm soát",
      },
      "Mint": {
        code: /(mint|_mint)/i.test(code)
          ? "Có khả năng mint thêm token"
          : "Không phát hiện mint",
        reality: /(maxSupply|fixed)/i.test(code)
          ? "Đã giới hạn supply → an toàn"
          : "Không giới hạn supply → có thể mint vô hạn",
      },
    };
    setResult(checks);
  };

  const checkToken = async (address) => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/getSource?address=${address}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.source) throw new Error("Không có mã nguồn");

      setSourceCode(data.source);
      scanSource(data.source);
    } catch (err) {
      setError("Lỗi khi kiểm tra: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteCheck = () => {
    if (sourceCode) scanSource(sourceCode);
  };

  return (
    <div style={{ fontFamily: "Arial", background: "#0f172a", color: "#fff", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28 }}>Token Scam Checker PRO ⚡</h1>
        <p style={{ color: "#9ca3af" }}>Kiểm tra rủi ro trong smart contract.</p>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ token (0x...)"
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #334155" }}
          />
          <button
            onClick={() => checkToken(address)}
            disabled={loading}
            style={{ padding: 10, borderRadius: 8, background: "#2563eb", color: "#fff", border: "none" }}
          >
            {loading ? "Đang kiểm tra..." : "Kiểm tra"}
          </button>
        </div>

        {error && <div style={{ marginTop: 12, padding: 12, background: "#7f1d1d", borderRadius: 8 }}>{error}</div>}

        <div style={{ marginTop: 16 }}>
          <label>Hoặc dán source code:</label>
          <textarea
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
            style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "#16a34a", color: "#fff", border: "none" }}
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
              <div style={{ padding: 12, fontWeight: "bold", background: "#0f172a" }}>Phân tích code</div>
              <div style={{ padding: 12, fontWeight: "bold", background: "#0f172a" }}>Nhận định</div>

              {Object.entries(result).map(([key, val]) => (
                <React.Fragment key={key}>
                  <div style={{ padding: 12, borderTop: "1px solid #334155" }}>{key}</div>
                  <div style={{ padding: 12, borderTop: "1px solid #334155", color: "#fbbf24" }}>{val.code}</div>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
