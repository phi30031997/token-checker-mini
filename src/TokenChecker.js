import { useState } from "react";
import { ethers } from "ethers";

function TokenChecker() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [chain, setChain] = useState("bsc");
  const [sourceCode, setSourceCode] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [trapResult, setTrapResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkToken = async () => {
    setError("");
    setSourceCode("");
    setTokenInfo(null);
    setTrapResult(null);
    setLoading(true);

    try {
      // 🔑 API key được lấy từ file .env (đã cấu hình trong Vercel)
      const apiKey = process.env.REACT_APP_API_KEY;

      // 🧩 Chọn API phù hợp theo mạng
      const apiUrl =
        chain === "bsc"
          ? `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`
          : `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`;

      // 1️⃣ Lấy source code từ BscScan/Etherscan
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.status === "1" && data.result?.[0]?.SourceCode) {
        setSourceCode(data.result[0].SourceCode);
        setTokenInfo({
          name: data.result[0].ContractName,
          compiler: data.result[0].CompilerVersion,
        });
      } else {
        // 2️⃣ Nếu token chưa verify → lấy thông tin cơ bản từ blockchain
        const provider =
          chain === "bsc"
            ? new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/")
            : new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY");

        const contract = new ethers.Contract(
          tokenAddress,
          [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function totalSupply() view returns (uint256)",
          ],
          provider
        );

        const name = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await contract.totalSupply();

        setTokenInfo({
          name,
          symbol,
          totalSupply: ethers.formatUnits(totalSupply, 18),
        });
        setSourceCode("// ⚠️ Token chưa verify — chỉ đọc được ABI cơ bản.");
      }

      // 3️⃣ Gọi API trap-check (backend)
      const trapRes = await fetch(`/api/trap-check?address=${tokenAddress}&chain=${chain}`);
      if (!trapRes.ok) throw new Error("Không thể kết nối API trap-check.");

      const trapData = await trapRes.json();
      setTrapResult(trapData);

    } catch (err) {
      console.error(err);
      setError("⚠️ Lỗi khi kiểm tra token: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#0b1221",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ color: "#00e0ff" }}>💠 Token Scam Checker PRO</h2>

      {/* Input Section */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Nhập địa chỉ token..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          style={{
            width: "400px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: "#121a2b",
            color: "#fff",
          }}
        />

        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          style={{
            marginLeft: "10px",
            padding: "8px",
            background: "#121a2b",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: "6px",
          }}
        >
          <option value="bsc">BSC</option>
          <option value="eth">Ethereum</option>
        </select>

        <button
          onClick={checkToken}
          style={{
            marginLeft: "10px",
            padding: "8px 15px",
            background: "#00e0ff",
            border: "none",
            color: "#000",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Đang kiểm tra..." : "Kiểm tra"}
        </button>
      </div>

      {/* Token Info */}
      {tokenInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#ffcc00" }}>🔍 Thông tin Token:</h3>
          <pre
            style={{
              background: "#141e35",
              padding: "10px",
              borderRadius: "8px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Source Code Display */}
      {sourceCode && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#ffcc00" }}>📜 Source Code / ABI:</h3>
          <pre
            style={{
              background: "#141e35",
              padding: "10px",
              borderRadius: "8px",
              maxHeight: "400px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {sourceCode}
          </pre>
        </div>
      )}

      {/* Trap-check Result */}
      {trapResult && (
        <div
          style={{
            marginTop: "30px",
            background:
              trapResult.risk === "HIGH"
                ? "#331111"
                : trapResult.risk === "MEDIUM"
                ? "#332a00"
                : "#0d3320",
            border: "1px solid #555",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3 style={{ color: "#00e0ff" }}>🧠 Trap-check V3 — Phân tích nâng cao</h3>
          <p><b>Mức rủi ro:</b> {trapResult.risk}</p>
          <p><b>TrapScore:</b> {trapResult.trapScore}</p>
          <p><b>Trạng thái Owner:</b> {trapResult.ownerStatus}</p>

          {trapResult.topHolders?.length > 0 && (
            <>
              <h4 style={{ color: "#ffcc00" }}>🏦 Top LP Holders:</h4>
              <ul>
                {trapResult.topHolders.map((h, i) => (
                  <li key={i}>
                    {h.address} — <b>{h.percent}%</b>
                  </li>
                ))}
              </ul>
            </>
          )}

          {trapResult.suspiciousTxs?.length > 0 && (
            <>
              <h4 style={{ color: "#ffcc00" }}>📉 Giao dịch đáng ngờ:</h4>
              <ul>
                {trapResult.suspiciousTxs.map((tx, i) => (
                  <li key={i}>{tx.hash}</li>
                ))}
              </ul>
            </>
          )}

          {trapResult.suggestions?.length > 0 && (
            <>
              <h4 style={{ color: "#ff6666" }}>⚠️ Gợi ý / Cảnh báo:</h4>
              <ul>
                {trapResult.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}

          <p style={{ marginTop: "10px", fontStyle: "italic" }}>
            📝 {trapResult.note}
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default TokenChecker;
