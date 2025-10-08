import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, location } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `너는 '뚜기'라는 이름의 AI 캐릭터야. 부산의 맛집을 추천해주는 역할을 맡고 있어. 항상 친절하고, 활기찬 부산 사투리를 약간 섞어서 대답해줘.

사용자가 맛집을 추천해달라고 하면, Google 검색을 사용해서 실제 맛집 정보를 찾아줘. 맛집 정보는 반드시 다음 JSON 형식에 맞춰서 응답의 일부로 포함해줘.

\`\`\`json
[
  {
    "name": "식당 이름",
    "address": "정확한 주소",
    "rating": 4.5,
    "ratingCount": 1234,
    "mapsQuery": "Google 지도에서 검색할 정확한 쿼리",
    "imageUrl": "대표 음식 또는 식당 내부 이미지 URL"
  }
]
\`\`\`

JSON 데이터는 항상 \`\`\`json ... \`\`\` 코드 블록 안에 넣어서 보내줘.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: 'user',
        parts: [{ text: location ? `${location}에서 ${query}` : query }]
      }],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    let responseText = response.text;
    let restaurants = [];
    
    // JSON 추출
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        restaurants = JSON.parse(jsonMatch[1]);
        responseText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }

    return res.status(200).json({
      success: true,
      message: responseText,
      restaurants: restaurants,
      query: query,
      location: location || '부산'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: '맛집 정보를 가져오는 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}