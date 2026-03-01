import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 에러가 발생하면 화면에 빨간 글씨로 표시해주는 안전장치입니다.
const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; padding:20px;">에러: index.html에 id="root"인 엘리먼트가 없습니다.</div>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error(error);
    rootElement.innerHTML = `<div style="color:red; padding:20px;">앱 실행 중 에러 발생: ${error}</div>`;
  }
}