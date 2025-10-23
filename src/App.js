import React, { useState } from "react";
import axios from "axios";

// PrismLight và import ngôn ngữ cho v15
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import solidity from "react-syntax-highlighter/dist/esm/languages/prism/solidity";

// Register ngôn ngữ
SyntaxHighlighter.registerLanguage("solidity", solidity);

function App() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [result, setResult] = useState("");

  const checkToken = async () => {
    setResult("");
    setSourceCode("");
    try {
      if (!tokenAddress) {
        setResult("⚠️ Vui lòng nhập địa chỉ token.");
        return;
      }

      const chain = tokenAddress.startsWith("0x") ? "bsc" : "eth";
      const apiKey = "YOUR_API_KEY"; // Thay bằng API key thật

      const url =
        chain === "bsc"
          ? `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`
          : `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${apiKey}`;

      const response = await axios.get(url);

      const source =
        response.data?.result?.[0]?.SourceCode || "";

      if (source) {
        setSourceCode(source);
        setResult("✅ Đã lấy được source code từ explorer.");
      } else {
        setResult(
          "⚠️ Không lấy được mã nguồn từ API. Vui lòng paste thủ công vào ô dưới."
        );
      }
    } catch (error) {
      console.error(error);
      setResult(
        "⚠️ Không lấy được mã nguồn từ API. Vui lòng paste thủ công vào ô dưới."
      );
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Token Scam Checker ⚡</h1>

      <input
        type="text"
        placeholder="Nhập địa chỉ token (BSC hoặc ETH)"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={checkToken}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Kiểm tra
      </button>

      <p style={{ marginTop: "10px", fontWeight: "bold" }}>{result}</p>

      <textarea
        placeholder="Hoặc dán source code contract ở đây"
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        rows={15}
        style={{
          width: "100%",
          marginTop: "10px",
          fontFamily: "monospace",
          fontSize: "14px",
          padding: "10px",
        }}
      />

      {sourceCode && (
        <SyntaxHighlighter
          language="solidity"
          style={okaidia}
          wrapLongLines={true}
        >
          {sourceCode}
        </SyntaxHighlighter>
      )}
    </div>
  );
}

export default App;
