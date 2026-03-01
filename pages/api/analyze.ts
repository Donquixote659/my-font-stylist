// api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// 환경변수가 없을 때를 대비해 빈 글자('')를 기본값으로 줍니다.
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST 방식이 아니면 에러를 보냅니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { query, language } = req.body;

  try {
    // 1. AI에게 분석 요청
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `사용자 질문: "${query}", 언어: "${language}". 이 질문에 어울리는 폰트 ID 3개를 JSON 배열 형태로 추천해줘. 예: [{"id": 1, "reason": "..."}]`;
    
    const result = await model.generateContent(prompt);
    const aiRecs = JSON.parse(result.response.text());

    // 2. DB에서 실제 데이터 가져오기
    const aiIds = aiRecs.map((r: any) => r.id);
    const { data: validatedFonts, error: dbError } = await supabase
      .from('fonts')
      .select('*')
      .in('id', aiIds);

    if (dbError) throw dbError;

    // 3. 결과 반환
    res.status(200).json(validatedFonts);
  } catch (error: any) {
    // 에러 발생 시 메시지 출력
    res.status(500).json({ error: error.message });
  }
}