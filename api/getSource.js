export default async function handler(req, res) {
  const { address, chain = "bsc" } = req.query;
  const API_KEY = "6IV9FDCJGRMJ4FTZE7HK9VIM8SH5FV2EPJ";

  if (!address)
    return res.status(400).json({ error: "Thiếu địa chỉ token (address)" });

  try {
    // API v2 endpoint mới của Etherscan Multi-chain
    const apiUrl = `https://api.etherscan.io/v2/api`;
    const params = new URLSearchParams({
      chainid:
        chain === "bsc"
          ? "56" // BSC mainnet
          : chain === "eth"
          ? "1" // Ethereum
          : "56",
      module: "contract",
      action: "getsourcecode",
      address,
      apikey: API_KEY,
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const text = await response.text();

    // Nếu API trả HTML thay vì JSON
    if (text.startsWith("<")) {
      console.error("⚠️ API trả về HTML:", text.slice(0, 120));
      return res
        .status(502)
        .json({ error: "API V2 bị lỗi hoặc trả về HTML (thử lại sau)" });
    }

    const data = JSON.parse(text);

    if (
      !data ||
      !data.data ||
      !data.data.result ||
      data.data.result.length === 0
    ) {
      return res.status(404).json({
        error: "Không lấy được mã nguồn (có thể token chưa verify hoặc lỗi API)",
      });
    }

    const sourceCode = data.data.result[0].SourceCode || "";

    if (!sourceCode) {
      return res
        .status(404)
        .json({ error: "Token chưa verify hoặc không có source code" });
    }

    return res.status(200).json({
      network: chain.toUpperCase(),
      source: sourceCode,
    });
  } catch (err) {
    console.error("❌ API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
