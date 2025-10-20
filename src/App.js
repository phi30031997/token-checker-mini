import React, { useState } from 'react';

const DEMO_BSCSCAN_KEY = 'Your_BscScan_API_Key_Here';
const DEMO_ETHERSCAN_KEY = 'Your_Etherscan_API_Key_Here';

function detectNetwork(address) {
  // very naive: check prefix 0x and length for EVM chains
  if (!address) return null;
  if (address.startsWith('0x') && address.length === 42) return 'evm';
  return null;
}

export default function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const checkToken = async () => {
    setError(null);
    setResult(null);
    const net = detectNetwork(address);
    if (!net) {
      setError('Địa chỉ không hợp lệ hoặc không phải EVM address (0x...).');
      return;
    }
    setLoading(true);
    try {
      // First try BscScan (demo) then Etherscan, depending on user choice
      // We'll call both APIs and combine source codes if available
      const bscUrl = `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${address}&apikey=${DEMO_BSCSCAN_KEY}`;
      const ethUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${DEMO_ETHERSCAN_KEY}`;

      const [bscRes, ethRes] = await Promise.allSettled([fetch(bscUrl), fetch(ethUrl)]);
      let source = '';

      if (bscRes.status === 'fulfilled') {
        const d = await bscRes.value.json();
        if (d && d.status === '1' && d.result && d.result[0] && d.result[0].SourceCode) {
          source += d.result[0].SourceCode + '\\n';
        }
      }
      if (ethRes.status === 'fulfilled') {
        const d = await ethRes.value.json();
        if (d && d.status === '1' && d.result && d.result[0] && d.result[0].SourceCode) {
          source += d.result[0].SourceCode + '\\n';
        }
      }

      if (!source) {
        setError('Không lấy được mã nguồn từ BscScan/Etherscan với API demo. Thay API key trong README hoặc dán code bằng tay.');
        setLoading(false);
        return;
      }

      // simple keyword checks
      const checks = {
        'Mode trap / Lock sell': /_mode|setMode|MODE_TRANSFER|revert\\(/i.test(source),
        'Blacklist control': /blacklist|isBlacklisted/i.test(source),
        'Tax / Fee control': /setFee|takeFee|enableTrading|_tax/i.test(source),
        'Owner only control': /onlyOwner|renounceOwnership/i.test(source),
        'Before Transfer Hook': /_beforeTokenTransfer|_transfer\\(/i.test(source),
      };

      setResult(checks);
    } catch (e) {
      setError('Lỗi khi kiểm tra: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Token Scam Checker Mini 🔍</h1>
        <p style={{ color: '#9ca3af' }}>Nhập địa chỉ token (BSC hoặc ETH). Ứng dụng sẽ dùng API demo để lấy mã nguồn và kiểm tra một số dấu hiệu rủi ro.</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ token (vd: 0x...)" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #334155' }} />
          <button onClick={checkToken} disabled={loading} style={{ padding: '10px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none' }}>
            {loading ? 'Đang kiểm tra...' : 'Kiểm tra'}
          </button>
        </div>

        {error && <div style={{ marginTop: 12, padding: 12, background: '#7f1d1d', borderRadius: 8 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 8 }}>Kết quả phân tích</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.entries(result).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, background: v ? '#3f1d1d' : '#073b1a' }}>
                  <div>{k}</div>
                  <div style={{ fontWeight: 'bold', color: v ? '#fca5a5' : '#86efac' }}>{v ? 'Nguy hiểm' : 'Không phát hiện'}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 10, color: '#94a3b8' }}>Lưu ý: Đây là kiểm tra nhanh bằng từ khoá. Không phải audit đầy đủ — sử dụng làm cảnh báo ban đầu.</p>
          </div>
        )}

        <div style={{ marginTop: 24, padding: 12, background: '#071327', borderRadius: 8, color: '#94a3b8' }}>
          <strong>Hướng dẫn nhanh:</strong>
          <ol>
            <li>Đổi API key trong <code>src/App.js</code> (biến DEMO_BSCSCAN_KEY và DEMO_ETHERSCAN_KEY) thành API của bạn nếu muốn kiểm tra thực tế.</li>
            <li>Nếu không có API key, dán source code contract vào thay thế (mình có thể hướng dẫn nếu cần).</li>
            <li>Lưu ý: Kiểm tra bằng từ khoá chỉ là bước đầu — audit chuyên sâu cần review code từng dòng.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
