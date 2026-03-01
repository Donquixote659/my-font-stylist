import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Settings, Type as FontIcon, Sparkles, FileJson } from 'lucide-react';
import { toPng } from 'html-to-image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Font {
  id: number;
  name: string;
  family: string;
  tags: string;
  level?: string;
  reason?: string;
}

const translations = {
  KO: {
    title: "AI 폰트 스타일리스트",
    searchPlaceholder: "어떤 느낌의 폰트를 찾으시나요? (예: 웅장한 게임 채널)",
    analyzing: "AI가 최적의 폰트를 분석 중입니다...",
    totalFonts: "전체 폰트 수",
    selected: "선택됨",
    loading: "폰트 데이터를 불러오는 중입니다...",
    retry: "다시 시도하기",
    aiPick: "AI 추천 결과",
    otherFonts: "기타 폰트 목록",
    allFonts: "전체 폰트 목록",
    downloadPng: "PNG 다운로드",
    downloadPremiere: "프리미어 프로용",
    skew: "기울기",
    fontSize: "폰트 크기",
    fontColor: "글자 색상",
    shadowColor: "그림자 색상",
    shadowBlur: "그림자 블러",
    shadowX: "그림자 X축",
    shadowY: "그림자 Y축",
    strokeColor: "테두리 색상",
    strokeWidth: "테두리 두께",
    languageSetting: "Language (언어 설정)",
    premiereNote: "* 프리미어 프로 연동 시 위 설정값이 포함된 JSON 파일이 생성됩니다. MOGRT 템플릿에 적용하여 사용하세요.",
    highlyRecommended: "매우 추천",
    recommended: "추천"
  },
  EN: {
    title: "AI Font Stylist",
    searchPlaceholder: "What kind of font are you looking for? (e.g., Epic Game Channel)",
    analyzing: "AI is analyzing the best fonts...",
    totalFonts: "Total Fonts",
    selected: "Selected",
    loading: "Loading font data...",
    retry: "Retry",
    aiPick: "AI Recommendations",
    otherFonts: "Other Fonts",
    allFonts: "All Fonts",
    downloadPng: "Download PNG",
    downloadPremiere: "For Premiere Pro",
    skew: "Skew",
    fontSize: "Font Size",
    fontColor: "Text Color",
    shadowColor: "Shadow Color",
    shadowBlur: "Shadow Blur",
    shadowX: "Shadow X",
    shadowY: "Shadow Y",
    strokeColor: "Stroke Color",
    strokeWidth: "Stroke Width",
    languageSetting: "Language Settings",
    premiereNote: "* A JSON file with these settings will be created for Premiere Pro. Use it in MOGRT templates.",
    highlyRecommended: "Highly Recommended",
    recommended: "Recommended"
  },
  JP: {
    title: "AIフォントスタイリスト",
    searchPlaceholder: "どんな雰囲気のフォントをお探しですか？（例：壮大なゲームチャンネル）",
    analyzing: "AIが最適なフォントを分析中です...",
    totalFonts: "全フォント数",
    selected: "選択済み",
    loading: "フォントデータを読み込み中です...",
    retry: "再試行",
    aiPick: "AIおすすめ結果",
    otherFonts: "その他のフォント",
    allFonts: "全フォントリスト",
    downloadPng: "PNGダウンロード",
    downloadPremiere: "Premiere Pro用",
    skew: "傾斜",
    fontSize: "フォントサイズ",
    fontColor: "文字色",
    shadowColor: "影の色",
    shadowBlur: "影のぼかし",
    shadowX: "影のX軸",
    shadowY: "影のY軸",
    strokeColor: "縁取りの色",
    strokeWidth: "縁取りの太さ",
    languageSetting: "言語設定 (Language)",
    premiereNote: "* Premiere Pro連動時、上記の設定値を含むJSONファイルが生成されます。MOGRTテンプレートに適用して使用してください。",
    highlyRecommended: "超おすすめ",
    recommended: "おすすめ"
  }
};

// 폰트 데이터 (간소화된 버전 - 실제로는 더 많을 수 있습니다)
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
  const [fonts, setFonts] = useState<Font[]>(mockFonts);
  const [recommendedFonts, setRecommendedFonts] = useState<Font[]>([]);
  const [selectedFont, setSelectedFont] = useState<Font | null>(mockFonts[0]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // 스타일 상태
  const [skew, setSkew] = useState(0);
  const [color, setColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#8b5cf6');
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);
  const [fontSize, setFontSize] = useState(64);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#8b5cf6');
  const [previewText, setPreviewText] = useState('AI 폰트 스타일리스트');
  const [language, setLanguage] = useState<'KO' | 'EN' | 'JP'>('KO');

  const t = translations[language];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `사용자의 요청: "${query}"에 어울리는 폰트를 추천해주세요.`,
        config: { responseMimeType: "application/json" }
      });
      // AI 로직 (실제 구현 시에는 더 정교한 프롬프트가 필요합니다)
      setRecommendedFonts([fonts[1], fonts[2]]); 
    } catch (err) {
      console.error(err);
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
    <div className="flex h-screen w-full bg-black text-white font-sans">
      {/* 왼쪽 패널: 검색 및 목록 */}
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
            className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 focus:border-neon-accent outline-none"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-accent">
            <Search className="w-5 h-5" />
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
                selectedFont?.id === font.id ? "bg-neon-accent/20 border-neon-accent shadow-neon" : "bg-white/5 border-white/10"
              )}
            >
              <div className="font-bold">{font.name}</div>
              <div className="text-xs text-white/40">{font.tags}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽 패널: 미리보기 및 컨트롤 */}
      <div className="w-[60%] flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-[#111] relative overflow-hidden">
          <div className="absolute top-6 right-6 flex gap-3">
            <button onClick={downloadPng} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm">
              <Download className="w-4 h-4" /> {t.downloadPng}
            </button>
          </div>
          
          <div
            ref={previewRef}
            style={{
              fontFamily: selectedFont?.family,
              fontSize: `${fontSize}px`,
              color: color,
              transform: `skewX(${skew}deg)`,
              textShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`,
              WebkitTextStroke: `${strokeWidth}px ${strokeColor}`
            }}
          >
            {previewText}
          </div>
        </div>

        {/* 컨트롤러 */}
        <div className="h-[40%] bg-white/5 border-t border-white/10 p-8 grid grid-cols-2 gap-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <label className="text-xs text-white/50 block">{t.fontSize} ({fontSize}px)</label>
            <input type="range" min="20" max="200" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-neon-accent" />
            
            <label className="text-xs text-white/50 block">{t.skew} ({skew}°)</label>
            <input type="range" min="-45" max="45" value={skew} onChange={e => setSkew(Number(e.target.value))} className="w-full accent-neon-accent" />
          </div>
          
          <div className="space-y-4">
            <label className="text-xs text-white/50 block">{t.fontColor}</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
            
            <label className="text-xs text-white/50 block">{t.shadowColor}</label>
            <input type="color" value={shadowColor} onChange={e => setShadowColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}