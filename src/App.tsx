// pages/index.tsx
import React, { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: 'ko' }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      alert('분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🎨 AI 폰트 스타일리스트</h1>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어떤 느낌의 폰트를 찾으시나요?"
        style={{ padding: '10px', width: '300px' }}
      />
      <button onClick={handleSearch} disabled={loading} style={{ padding: '10px 20px', marginLeft: '10px' }}>
        {loading ? '분석 중...' : '추천받기'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {results.map((font) => (
          <div key={font.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '8px' }}>
            <h3 style={{ fontFamily: font.family }}>{font.name}</h3>
            <p>{font.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}