// pages/api/getSource.js
import axios from "axios";

export default async function handler(req, res) {
  const { address, chain } = req.query;
  const apiKey = process.env.REACT_APP_API_KEY;

  if (!address)
    return res.status(400).json({ error: "Thiếu địa chỉ token." });

  try {
    const baseUrl =
      chain === "bsc"
        ? "https://api.bscscan.com/api"
        : "https://api.etherscan.io/api";

    const url = `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    const { data } = await axios.get(url);

    if (data.status === "1" && data.result?.[0]) {
      return res.status(200).json({
        source: data.result[0].SourceCode,
        name: data.result[0].ContractName,
        compiler: data.result[0].CompilerVersion,
      });
    } else {
      return res.status(404).json({
        error: "Không tìm thấy source code (token chưa verify hoặc lỗi API).",
      });
    }
  } catch (e) {
    console.error("Lỗi khi gọi Etherscan/BscScan:", e.message);
    res.status(500).json({ error: "Lỗi khi gọi API ngoài.", detail: e.message });
  }
}
