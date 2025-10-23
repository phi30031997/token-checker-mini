import React, { useState } from 'react';
import './App.css';

// API key duy nhất (đặt trong .env)
const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [address, setAddress] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // --- Hàm quét mã nguồn ---
  const scanSource = (code) => {
    if (!code) return;
    const checks = {
      'Mint toàn bộ cho owner': /_mint\s*\(\s*owner\s*\(\s*\)\s*,\s*totalSupply\s*\)/i.test(code),
      'Mode trap / Lock sell': /(_mode|setMode|MODE_TRANSFER|revert\()/i.test(code),
      'Blacklist control': /(blacklist|isBlacklisted)/i.test(code),
      'Tax / Fee control': /(setFee|takeFee|enableTrading|_tax)/i.test(code),
      'Owner only control': /(onlyOwner|renounceOwnership)/i.test(code),
      'Before Transfer Hook (có thể chặn bán)': /(_beforeTokenTransfer|MODE_TRANSFER_RESTRICTED)/i.test(code),
    };
    setResult(checks);
  };

  // --- Hàm kiểm tra token từ API ---
  const checkToken = async (address) => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ethUrl = `https://api.etherscan.io/v2/api?chainid=1&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`;
      const bscUrl = `https://api.etherscan.io/v2/api?chainid=56&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`;

      // chạy song song 2 API (ETH + BSC)
      const [ethRes, bscRes] = await Promise.allSettled([fetch(ethUrl), fetch(bscUrl)]);

      let source = '';

      const parseResponse = async (res) => {
        if (res.status === 'fulfilled') {
          const data = await res.value.json();
          if (data?.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
            const code = data.result[0].SourceCode;
            if (code && code.length > 0) return code;
          }
        }
        return '';
      };

      const ethSource = await parseResponse(ethRes);
      const bscSource = await parseResponse(bscRes);
      source = ethSource + '\n' + bscSource;

      if (!source.trim()) {
        setError('⚠️ Không lấy được mã nguồn từ Etherscan V2. Hãy dán source code thủ công để kiểm tra.');
        setLoading(false);
        return;
      }

      setSourceCode(source);
      scanSource(source);
    } catch (e) {
      setError('Lỗi khi kiểm tra: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePasteCheck = () => {
    if (!sourceCode) return;
    scanSource(sourceCode);
  };

  // --- Giao diện chính ---
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Token Scam Checker ⚡</h1>
        <p style={{ color: '#9ca3af' }}>
          Nhập địa chỉ token (BSC hoặc ETH) hoặc dán source code để kiểm tra dấu hiệu rủi ro.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ token (vd: 0x...)"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #334155' }}
          />
          <button
            onClick={() => checkToken(address)}
            disabled={loading}
            style={{ padding: '10px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none' }}
          >
            {loading ? 'Đang kiểm tra...' : 'Kiểm tra'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: '#7f1d1d', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label htmlFor="pasteSource">Hoặc dán source code contract:</label>
          <textarea
            id="pasteSource"
            rows={10}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            style={{
              width: '100%',
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#fff',
            }}
          />
          <button
            onClick={handlePasteCheck}
            style={{
              marginTop: 8,
              padding: '10px 16px',
              borderRadius: 8,
              background: '#16a34a',
              color: '#fff',
              border: 'none',
            }}
          >
            Check source code
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 8 }}>Kết quả phân tích</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.entries(result).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 8,
                    background: v ? '#3f1d1d' : '#073b1a',
                  }}
                >
                  <div>{k}</div>
                  <div style={{ fontWeight: 'bold', color: v ? '#fca5a5' : '#86efac' }}>
                    {v ? 'Nguy hiểm' : 'Không phát hiện'}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 10, color: '#94a3b8' }}>
              ⚠️ Đây là kiểm tra nhanh bằng từ khóa, không phải audit đầy đủ. Nên dùng như công cụ cảnh báo ban đầu.
            </p>
          </div>
        )}

        <div style={{ marginTop: 24, padding: 12, background: '#071327', borderRadius: 8, color: '#94a3b8' }}>
          <strong>Hướng dẫn nhanh:</strong>
          <ol>
            <li>Đặt API key duy nhất vào <code>.env</code> với tên <code>REACT_APP_API_KEY</code>.</li>
            <li>Nếu token chưa verified, dán source code vào ô bên trên để check.</li>
            <li>Kiểm tra bằng từ khóa chỉ là bước đầu — audit chuyên sâu vẫn cần review từng dòng code.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
