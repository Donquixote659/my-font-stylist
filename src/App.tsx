import React, { useState, useRef } from 'react';
import { Search, Download, Sparkles, Type as FontIcon } from 'lucide-react';
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

const translations = {
  KO: {
    title: "AI 폰트 스타일리스트",
    searchPlaceholder: "어떤 느낌의 폰트를 찾으시나요? (예: 웅장한 게임 채널)",
    analyzing: "AI가 최적의 폰트를 분석 중입니다...",
    allFonts: "전체 폰트 목록",
    downloadPng: "PNG 다운로드",
    fontSize: "폰트 크기",
    skew: "기울기",
    fontColor: "글자 색상",
    shadowColor: "그림자 색상"
  }
};

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
  const [fonts] = useState<Font[]>(mockFonts);
  const [selectedFont, setSelectedFont] = useState<Font | null>(mockFonts[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [skew, setSkew] = useState(0);
  const [color, setColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#8b5cf6');
  const [fontSize, setFontSize] = useState(64);
  const [previewText, setPreviewText] = useState('AI 폰트 스타일리스트');

  const t = translations.KO;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `사용자의 요청: "${query}". 이 요청에 가장 잘 어울리는 폰트 스타일(색상, 그림자색 등)을 추천해줘.`;
      const result = await model.generateContent(prompt);
      console.log(result.response.text());
      
      // 데모용으로 폰트 변경 시뮬레이션
      setSelectedFont(fonts[Math.floor(Math.random() * fonts.length)]);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPng = async () => {
    if (previewRef.current) {
      const dataUrl = await toPng(previewRef.current);
      const link = document.createElement('a');
      link.download = 'font-style.png';
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden">
      <div className="w-[40%] flex flex-col border-r border-white/10 p-6 overflow-y-auto custom-scrollbar">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 neon-text">
          <Sparkles className="w-6 h-6" /> {t.title}
        </h1>
        
        <form onSubmit={handleSearch} className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 focus:border-purple-500 outline-none"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
            {isAnalyzing ? "..." : <Search className="w-5 h-5" />}
          </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">{t.allFonts}</h2>
          {fonts.map(font => (
            <button
              key={font.id}
              onClick={() => setSelectedFont(font)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all",
                selectedFont?.id === font.id ? "bg-purple-500/20 border-purple-500" : "bg-white/5 border-white/10"
              )}
            >
              <div className="font-bold">{font.name}</div>
              <div className="text-xs text-white/40">{font.tags}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-[60%] flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-[#111] relative">
          <div className="absolute top-6 right-6">
            <button onClick={downloadPng} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              <Download className="w-4 h-4" /> {t.downloadPng}
            </button>
          </div>
          
          <div
            ref={previewRef}
            className="p-10"
            style={{
              fontFamily: selectedFont?.family,
              fontSize: `${fontSize}px`,
              color: color,
              transform: `skewX(${skew}deg)`,
              textShadow: `0 0 15px ${shadowColor}`,
            }}
          >
            {previewText}
          </div>
        </div>

        <div className="h-[40%] bg-white/5 border-t border-white/10 p-8 grid grid-cols-2 gap-8 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="text-xs text-white/50 block mb-2">{t.fontSize} ({fontSize}px)</label>
              <input type="range" min="20" max="150" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">{t.skew} ({skew}°)</label>
              <input type="range" min="-45" max="45" value={skew} onChange={e => setSkew(Number(e.target.value))} className="w-full accent-purple-500" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs text-white/50 block mb-2">{t.fontColor}</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">{t.shadowColor}</label>
              <input type="color" value={shadowColor} onChange={e => setShadowColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}