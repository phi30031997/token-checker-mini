import { useState } from "react";
import { ethers } from "ethers";

function TokenChecker() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [chain, setChain] = useState("bsc"); // "bsc" hoặc "eth"
  const [sourceCode, setSourceCode] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState("");

  const checkToken = async () => {
    setError("");
    setSourceCode("");
    setTokenInfo(null);

    try {
      const apiKey = process.env.REACT_APP_API_KEY;
      const apiUrl =
        chain === "bsc"
          ? `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`
          : `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`;

      // 1️⃣ Lấy source code từ API
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.status === "1" && data.result[0].SourceCode) {
        setSourceCode(data.result[0].SourceCode);
        setTokenInfo({
          name: data.result[0].ContractName,
          compiler: data.result[0].CompilerVersion,
        });
        return;
      }

      // 2️⃣ Token chưa verify → đọc ABI trực tiếp
      const provider =
        chain === "bsc"
          ? new ethers.BrowserProvider("https://bsc-dataseed.binance.org/")
          : new ethers.BrowserProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY"); // Hoặc dùng MetaMask

      const contract = new ethers.Contract(tokenAddress, [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)"
      ], provider);

      const name = await contract.name();
      const symbol = await contract.symbol();
      const totalSupply = await contract.totalSupply();

      setTokenInfo({ name, symbol, totalSupply: ethers.formatUnits(totalSupply, 18) });
      setSourceCode("// Token chưa verify, ABI được đọc trực tiếp từ blockchain");
    } catch (err) {
      console.error(err);
      setError("⚠️ Lỗi khi lấy thông tin token: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Token Scam Checker ⚡</h2>
      <input
        type="text"
        placeholder="Nhập địa chỉ token"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        style={{ width: "400px", padding: "5px" }}
      />
      <select value={chain} onChange={e => setChain(e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
        <option value="bsc">BSC</option>
        <option value="eth">Ethereum</option>
      </select>
      <button onClick={checkToken} style={{ marginLeft: "10px", padding: "5px 10px" }}>
        Kiểm tra
      </button>

      {tokenInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3>Thông tin token:</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#eee", padding: "10px" }}>
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
      )}

      {sourceCode && (
        <div style={{ marginTop: "20px" }}>
          <h3>Mã nguồn / ABI:</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#eee", padding: "10px" }}>
            {sourceCode}
          </pre>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </div>
  );
}

export default TokenChecker;
