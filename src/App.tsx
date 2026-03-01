import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, Type, Download, Settings2, Sparkles, ChevronRight, RotateCcw, 
  FileJson, Languages, Loader2, AlertCircle, CheckCircle2, Palette, 
  LayoutGrid, Maximize2, Minus, Plus, Shadow as ShadowIcon, PenTool
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";

// --- Supabase Client Initialization (Fixed) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Font {
  id: number;
  name: string;
  family: string;
  tags: string;
}

interface RecommendedFont {
  id: number;
  reason: string;
  style: {
    fontSize: number;
    color: string;
    shadow: string;
    skew: number;
    stroke?: string;
    strokeWidth?: number;
  };
}

const translations = {
  KO: {
    title: "AI 폰트 스타일리스트",
    subtitle: "크리에이터를 위한 맞춤형 폰트 추천",
    searchPlaceholder: "어떤 느낌의 자막을 원하시나요? (예: '공포 게임 유튜브 제목')",
    analyzing: "AI 분석 중...",
    recommendations: "AI 추천 폰트",
    allFonts: "모든 폰트",
    previewText: "미리보기 텍스트",
    downloadPng: "PNG 다운로드",
    exportJson: "프리미어용 JSON",
    styleSettings: "스타일 설정",
    fontSize: "크기",
    skew: "기울기",
    color: "색상",
    shadow: "그림자",
    stroke: "테두리",
    noResults: "결과 없음",
    errorApiKey: "Gemini API 키가 없습니다. Vercel 환경 변수(VITE_GEMINI_API_KEY)를 확인하세요.",
    loadingFonts: "폰트 로딩 중...",
    loadMore: "더 보기"
  },
  EN: {
    title: "AI Font Stylist",
    subtitle: "Custom font recommendations",
    searchPlaceholder: "What vibe do you want? (e.g., 'horror game title')",
    analyzing: "Analyzing...",
    recommendations: "AI Recommended",
    allFonts: "All Fonts",
    previewText: "Preview Text",
    downloadPng: "Download PNG",
    exportJson: "JSON for Premiere",
    styleSettings: "Style Settings",
    fontSize: "Size",
    skew: "Skew",
    color: "Color",
    shadow: "Shadow",
    stroke: "Stroke",
    noResults: "No results.",
    errorApiKey: "Gemini API key is missing.",
    loadingFonts: "Loading fonts...",
    loadMore: "Load More"
  },
  JP: {
    title: "AIフォントスタイリスト",
    subtitle: "カスタムフォント推薦",
    searchPlaceholder: "どんな感じの字幕にしたいですか？",
    analyzing: "分析中...",
    recommendations: "AIおすすめ",
    allFonts: "すべてのフォント",
    previewText: "プレビューテキスト",
    downloadPng: "PNGダウンロード",
    exportJson: "Premiere用JSON",
    styleSettings: "スタイル設定",
    fontSize: "サイズ",
    skew: "斜体",
    color: "色",
    shadow: "影",
    stroke: "縁取り",
    noResults: "結果なし",
    errorApiKey: "Gemini APIキーが設定されていません。",
    loadingFonts: "読み込み中...",
    loadMore: "もっと見る"
  }
};

const fontNameMap: Record<string, any> = {
  "노토 산스 KR": { KO: "노토 산스 KR", EN: "Noto Sans KR", JP: "Noto Sans KR" },
  "검은고딕": { KO: "검은고딕", EN: "Black Han Sans", JP: "Black Han Sans" },
  "도현체": { KO: "도현체", EN: "Do Hyeon", JP: "Do Hyeon" },
  "주아체": { KO: "주아체", EN: "Jua", JP: "Jua" },
  "나눔명조": { KO: "나눔명조", EN: "Nanum Myeongjo", JP: "Nanum Myeongjo" }
};

export default function App() {
  const [query, setQuery] = useState('');
  const [fonts, setFonts] = useState<Font[]>([]);
  const [recommendedFonts, setRecommendedFonts] = useState<RecommendedFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFont, setSelectedFont] = useState<Font | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [skew, setSkew] = useState(0);
  const [color, setColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(4);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);
  const [fontSize, setFontSize] = useState(64);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#8b5cf6');
  const [previewText, setPreviewText] = useState('가나다라마바사 얍! ABCabc123');
  const [language, setLanguage] = useState<'KO' | 'EN' | 'JP'>('KO');
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);

  const t = translations[language];

  const loadFonts = async (retries = 3) => {
    setLoading(true);
    try {
      let loadedFonts: Font[] = [];
      if (supabase) {
        const { data, error: sbError } = await supabase.from('fonts').select('*');
        if (!sbError && data) loadedFonts = data;
      }
      if (loadedFonts.length === 0) {
        const response = await fetch('/fonts.json');
        loadedFonts = await response.json();
      }
      setFonts(loadedFonts);
      if (loadedFonts.length > 0) setSelectedFont(loadedFonts[0]);
    } catch (err) {
      if (retries > 0) setTimeout(() => loadFonts(retries - 1), 1000);
      else setError("폰트 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFonts(); }, []);

  useEffect(() => {
    if (fonts.length > 0) {
      const families = new Set<string>();
      recommendedFonts.forEach(r => { const f = fonts.find(ft => ft.id === r.id); if(f) families.add(f.name); });
      fonts.slice(0, displayCount).forEach(f => families.add(f.name));
      if (selectedFont) families.add(selectedFont.name);

      const links: HTMLLinkElement[] = [];
      Array.from(families).forEach(f => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css?family=${f.replace(/ /g, '+')}&display=swap`;
        document.head.appendChild(link);
        links.push(link);
      });
      return () => links.forEach(l => document.head.contains(l) && document.head.removeChild(l));
    }
  }, [fonts, recommendedFonts, displayCount, selectedFont]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || fonts.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error(t.errorApiKey);
      const ai = new GoogleGenAI({ apiKey });
      const fontContext = fonts.slice(0, 150).map(f => `ID:${f.id},N:${f.name},T:${f.tags}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `사용자 요청: "${query}", 언어: ${language}\n목록:\n${fontContext}\nJSON 배열로 4개 추천해줘.`,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "[]");
      setRecommendedFonts(parsed);
      const first = fonts.find(f => f.id === parsed[0]?.id);
      if (first) { setSelectedFont(first); applyStyle(parsed[0].style); }
    } catch (err: any) { setError(err.message); } finally { setIsAnalyzing(false); }
  };

  const applyStyle = (s: any) => {
    if (s.fontSize) setFontSize(s.fontSize);
    if (s.color) setColor(s.color);
    if (s.skew !== undefined) setSkew(s.skew);
    if (s.stroke) setStrokeColor(s.stroke);
    if (s.strokeWidth !== undefined) setStrokeWidth(s.strokeWidth);
  };

  const downloadImage = async () => {
    if (previewRef.current) {
      const dataUrl = await toPng(previewRef.current);
      const link = document.createElement('a');
      link.download = `font-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="text-violet-500" />
          <h1 className="text-2xl font-bold">{t.title}</h1>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
          {(['KO', 'EN', 'JP'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)} className={cn("px-3 py-1 rounded text-xs", language === l ? "bg-violet-600" : "text-zinc-500")}>{l}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2 bg-zinc-900 p-2 rounded-xl border border-white/10">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder} className="flex-1 bg-transparent border-none focus:ring-0 px-4" />
            <button type="submit" disabled={isAnalyzing} className="bg-violet-600 px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} AI 추천
            </button>
          </form>

          <div ref={previewRef} className="aspect-video bg-zinc-900 rounded-3xl border border-white/5 flex items-center justify-center p-12 relative overflow-hidden">
            <div style={{
              fontFamily: selectedFont?.family, fontSize: `${fontSize}px`, color, transform: `skewX(${skew}deg)`,
              textShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`,
              WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none'
            }}>{previewText}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fonts.slice(0, displayCount).map(f => (
              <button key={f.id} onClick={() => setSelectedFont(f)} className={cn("p-4 rounded-xl border text-left", selectedFont?.id === f.id ? "border-violet-500 bg-violet-500/5" : "border-white/5 bg-zinc-900/50")}>
                <p className="text-[10px] text-zinc-500 mb-1">{f.name}</p>
                <p style={{ fontFamily: f.family }} className="text-lg truncate">ABC가나다</p>
              </button>
            ))}
          </div>
          <button onClick={() => setDisplayCount(d => d + 20)} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-zinc-500">더 보기</button>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-white/10 space-y-6">
            <textarea value={previewText} onChange={e => setPreviewText(e.target.value)} className="w-full bg-black/40 border-white/5 rounded-xl p-4 text-sm h-24 resize-none" />
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase">Size: {fontSize}px</label>
              <input type="range" min="12" max="200" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-violet-500" />
              <label className="text-xs font-bold text-zinc-500 uppercase">Skew: {skew}deg</label>
              <input type="range" min="-30" max="30" value={skew} onChange={e => setSkew(Number(e.target.value))} className="w-full accent-violet-500" />
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Color</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Stroke</label>
                  <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-full h-10 bg-transparent border-none cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadImage} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> PNG</button>
              <button onClick={() => {
                const data = { font: selectedFont?.family, size: fontSize, color };
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'style.json'; a.click();
              }} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><FileJson className="w-4 h-4" /> JSON</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}