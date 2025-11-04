import fetch from "node-fetch";

export default async function handler(req, res) {
  const { address, chainid } = req.query;

  if (!address) {
    return res.status(400).json({ status: "0", message: "Missing address" });
  }

  // Chọn base API theo chain
  let apiBase = "https://api.etherscan.io/api"; // Ethereum
  if (chainid === "56") apiBase = "https://api.bscscan.com/api"; // BSC
  if (chainid === "137") apiBase = "https://api.polygonscan.com/api"; // Polygon

  const API_KEY = process.env.ETHERSCAN_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ status: "0", message: "Missing API key" });
  }

  const url = `${apiBase}?module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);

    // check content-type trả về
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text(); // đọc HTML hoặc lỗi
      return res
        .status(500)
        .json({ status: "0", message: "API trả không phải JSON", body: text });
    }

    const data = await response.json();

    if (!data || data.status !== "1") {
      return res.status(500).json({ status: "0", message: "Cannot fetch source" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: "0", message: err.message });
  }
}
