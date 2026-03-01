import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, Sparkles, Type as FontIcon, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenerativeAI } from "@google/generative-ai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Font {
  id: number;
  name: string;
  family: string;
  tags: string;
}

const mockFonts: Font[] = [
  { id: 1, name: "노토 산스 KR", family: "'Noto Sans KR'", tags: "한글, 깔끔한, 기본" },
  { id: 2, name: "검은고딕", family: "'Black Han Sans'", tags: "한글, 제목용, 웅장한" },
  { id: 3, name: "도현체", family: "'Do Hyeon'", tags: "한글, 귀여운, 제목용" },
  { id: 4, name: "주아체", family: "'Jua'", tags: "한글, 부드러운, 귀여운" },
  { id: 5, name: "나눔명조", family: "'Nanum Myeongjo'", tags: "한글, 우아한, 명조" },
  { id: 6, name: "Anton", family: "'Anton'", tags: "영어, 굵은, 임팩트" },
  { id: 7, name: "Lobster", family: "'Lobster'", tags: "영어, 필기체, 부드러운" },
  { id: 8, name: "Bebas Neue", family: "'Bebas Neue'", tags: "영어, 제목용, 깔끔한" }
];

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedFont, setSelectedFont] = useState<Font>(mockFonts[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // 스타일 상태
  const [skew, setSkew] = useState(0);
  const [color, setColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#8b5cf6');
  const [fontSize, setFontSize] = useState(80);
  const [previewText, setPreviewText] = useState('AI FONT STYLIST');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        사용자 요청: "${query}"
        이 요청에 어울리는 폰트 스타일을 추천해줘. 
        결과는 반드시 아래 JSON 형식으로만 대답해줘:
        {
          "color": "HEX색상코드",
          "shadowColor": "HEX색상코드",
          "fontSize": 숫자(40-120),
          "skew": 숫자(-20에서 20 사이),
          "fontIndex": 숫자(0-7 사이)
        }
      `;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // JSON 부분만 추출
      const jsonMatch = responseText.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setColor(data.color || '#ffffff');
        setShadowColor(data.shadowColor || '#8b5cf6');
        setFontSize(data.fontSize || 80);
        setSkew(data.skew || 0);
        setSelectedFont(mockFonts[data.fontIndex % mockFonts.length]);
      }
    } catch (err) {
      console.error("AI Error:", err);
      // 에러 시 랜덤하게라도 변경해서 피드백 제공
      setSelectedFont(mockFonts[Math.floor(Math.random() * mockFonts.length)]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPng = async () => {
    if (previewRef.current) {
      try {
        const dataUrl = await toPng(previewRef.current, { backgroundColor: '#111' });
        const link = document.createElement('a');
        link.download = `font-style-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Download Error:", err);
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
      {/* 왼쪽 사이드바: 컨트롤 및 리스트 */}
      <div className="w-[380px] flex flex-col border-r border-white/10 bg-[#0a0a0a] p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-purple-600 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight italic">FONT STYLIST</h1>
        </div>
        
        <form onSubmit={handleSearch} className="relative mb-10">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-bold">AI Style Search</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 웅장한 게임 채널 타이틀"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 pr-12 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-sm"
          />
          <button 
            type="submit" 
            disabled={isAnalyzing}
            className="absolute right-3 bottom-3 p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Font Library</h2>
            <span className="text-[10px] text-white/20">{mockFonts.length} Fonts</span>
          </div>
          
          <div className="grid gap-3">
            {mockFonts.map(font => (
              <button
                key={font.id}
                onClick={() => setSelectedFont(font)}
                className={cn(
                  "group relative w-full text-left p-4 rounded-xl border transition-all duration-300",
                  selectedFont.id === font.id 
                    ? "bg-purple-600/10 border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.1)]" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm tracking-tight">{font.name}</span>
                  {selectedFont.id === font.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
                </div>
                <div className="text-[10px] text-white/30 font-mono italic">{font.tags}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 메인: 프리뷰 및 상세 조절 */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {/* 프리뷰 영역 */}
        <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
          </div>

          <div className="absolute top-8 right-8 z-10">
            <button 
              onClick={downloadPng} 
              className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <Download className="w-4 h-4" /> DOWNLOAD PNG
            </button>
          </div>

          <div className="absolute top-8 left-8 text-[10px] tracking-[0.3em] text-white/20 font-bold uppercase">
            Live Preview / Click text to edit
          </div>
          
          <div
            ref={previewRef}
            className="relative z-10 w-full flex justify-center items-center py-20 px-10 transition-all duration-500 ease-out"
            style={{ transform: `skewX(${skew}deg)` }}
          >
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              spellCheck={false}
              className="bg-transparent border-none outline-none text-center w-full resize-none overflow-hidden leading-tight transition-all duration-300"
              style={{
                fontFamily: selectedFont.family,
                fontSize: `${fontSize}px`,
                color: color,
                textShadow: `0 0 20px ${shadowColor}, 0 0 40px ${shadowColor}44`,
                height: 'auto',
                minHeight: '1em'
              }}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        </div>

        {/* 하단 컨트롤 바 */}
        <div className="h-[320px] bg-[#0a0a0a] border-t border-white/10 p-10 grid grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="group">
              <div className="flex justify-between mb-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold group-hover:text-purple-400 transition-colors">Font Size</label>
                <span className="text-[10px] font-mono text-white/60">{fontSize}px</span>
              </div>
              <input 
                type="range" min="30" max="150" value={fontSize} 
                onChange={e => setFontSize(Number(e.target.value))} 
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" 
              />
            </div>
            <div className="group">
              <div className="flex justify-between mb-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold group-hover:text-purple-400 transition-colors">Skew Angle</label>
                <span className="text-[10px] font-mono text-white/60">{skew}°</span>
              </div>
              <input 
                type="range" min="-30" max="30" value={skew} 
                onChange={e => setSkew(Number(e.target.value))} 
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Text Color</label>
              <div className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <input 
                  type="color" value={color} 
                  onChange={e => setColor(e.target.value)} 
                  className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg" 
                />
                <span className="text-xs font-mono text-white/40 uppercase">{color}</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Glow Color</label>
              <div className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <input 
                  type="color" value={shadowColor} 
                  onChange={e => setShadowColor(e.target.value)} 
                  className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg" 
                />
                <span className="text-xs font-mono text-white/40 uppercase">{shadowColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}