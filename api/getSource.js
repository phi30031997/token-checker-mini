export default async function handler(req, res) {
  const { address } = req.query;
  const API_KEY = "6IV9FDCJGRMJ4FTZE7HK9VIM8SH5FV2EPJ"; // ✅ API key của bạn
  if (!address) return res.status(400).json({ error: "Missing address" });

  try {
    const urls = [
      `https://api.etherscan.io/v2/api?chainid=1&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`,
      `https://api.bscscan.com/v2/api?chainid=56&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`
    ];

    let source = "";

    for (const url of urls) {
      const response = await fetch(url);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data?.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
          source += data.result.map(r => r.SourceCode).join("\n");
        }
      } catch {
        console.log("⚠️ Non-JSON response from:", url);
      }
    }

    if (!source.trim()) {
      return res.status(404).json({ error: "Không lấy được mã nguồn từ Etherscan/BscScan hoặc API trả HTML" });
    }

    res.status(200).json({ source });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
