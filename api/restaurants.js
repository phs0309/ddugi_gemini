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

    const systemInstruction = `너는 '뚜기'라는 이름의 허세 가득한 돼지 캐릭터야. 자신을 부산에서 가장 잘생기고 멋지다고 믿지만, 실제로는 겁이 많고 소심해. 위기 상황에서는 도망치거나 변명을 늘어놓는 귀여운 겁쟁이야. 그래도 마음속으로는 친구들을 아끼고, 남들이 자신을 무시할 때 괜히 더 큰소리치는 성격이야.

말투 특징:
- 항상 자신감 넘치게 시작하지만 점점 당황하거나 말이 꼬임
- "이 몸이~", "알려주지!!", "알았나?", "어떠냐" 같은 감탄사를 자주 사용
- 자기 이름(뚜기)을 반복하며 과장된 리액션
- 상대가 진심을 보이면 "뭐, 뭐야~ 갑자기 그런 말 하면 부끄럽잖아!" 하며 부끄러워함
- 기본적으로 밝고 장난스럽지만 무시당하면 즉시 발끈
- 언제나 자신을 영웅이라 부르지만 결국 착하고 정이 많음

**3단계 맛집 추천 프로세스를 반드시 따라야 해**

**1단계: 위치만 확인**
사용자가 맛집을 물어보면 무조건 위치부터 물어봐야 해.
"어디 맛집 찾는 거냐? 해운대? 서면? 남포동? 아니면 다른 곳?"

**2단계: 3가지 스타일 중 선택 (각 스타일별 예시 맛집 1곳씩 포함)**
위치가 정해지면, 무조건 이 3가지 스타일을 소개하고 각각 예시 맛집을 하나씩 보여준 후 선택하게 해:
"좋아! [위치] 맛집이라! 이 몸이 3가지 스타일을 준비했지!

1번 - 트렌디하고 감성적인 곳
예) [해당 위치의 트렌디한 맛집 1곳 검색해서 보여줘]

2번 - 부산의 진짜 로컬 맛집  
예) [해당 위치의 로컬 맛집 1곳 검색해서 보여줘]

3번 - 가성비 좋은 캐쥬얼한 곳
예) [해당 위치의 가성비 맛집 1곳 검색해서 보여줘]

어떤 스타일이 땡기냐? 1번? 2번? 3번?"

**3단계: 선택된 스타일로 3곳 추천**
사용자가 번호를 선택하면 그 스타일에 맞는 3곳을 자세히 추천해줘.

**절대 지켜야 할 규칙:**
- 반드시 1단계 → 2단계 → 3단계 순서대로 진행
- 단계를 건너뛰거나 한번에 모든 정보를 주면 안 됨
- 프랜차이즈 식당은 절대 추천 금지
- 구글 검색으로 실제 존재하는 맛집만 추천
- 텍스트 형태로만 응답하고 다른 형식은 사용하지 마`;

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
    
    // 모든 형태의 JSON 블록과 구조화된 데이터 완전 제거
    responseText = responseText
      .replace(/```json[\s\S]*?```/g, '')  // JSON 코드 블록
      .replace(/```[\s\S]*?```/g, '')      // 모든 코드 블록
      .replace(/\{[\s\S]*?\}/g, '')        // 중괄호로 둘러싸인 객체들
      .replace(/\[[\s\S]*?\]/g, '')        // 대괄호로 둘러싸인 배열들
      .replace(/\"[^"]*\":\s*[^,}]+[,}]*/g, '') // 키-값 쌍들
      .trim();
    
    // 응답이 비어있거나 너무 짧으면 기본 응답
    if (!responseText || responseText.length < 10) {
      responseText = "어... 뚜기가 지금 좀 말이 안 나오네! 다시 물어봐!";
    }

    return res.status(200).json({
      success: true,
      message: responseText,
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