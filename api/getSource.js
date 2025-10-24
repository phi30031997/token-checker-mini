// /api/getSource.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: "Chưa có địa chỉ token" });

  const API_KEY = process.env.ETHERSCAN_API_KEY;

  const endpoints = [
    `https://api.etherscan.io/v2/api?chainid=1&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`,
    `https://api.etherscan.io/v2/api?chainid=56&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`,
  ];

  try {
    let source = "";

    for (const url of endpoints) {
      const r = await fetch(url);
      const text = await r.text();
      try {
        const data = JSON.parse(text);
        if (data?.status === "1" && data?.result?.length > 0) {
          source += data.result.map((r) => r.SourceCode).join("\n");
        }
      } catch {
        console.warn("API không trả JSON, raw text:", text);
      }
    }

    if (!source.trim()) {
      return res.json({ error: "Không lấy được mã nguồn từ Etherscan/BscScan hoặc API trả HTML" });
    }

    res.json({ source });
  } catch (e) {
    res.json({ error: "Lỗi server khi lấy mã nguồn: " + String(e) });
  }
}
