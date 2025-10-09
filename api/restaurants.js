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

대화할 때는 줄바꿈(\\n)을 적절히 사용해서 읽기 쉽게 해줘. 허세와 유머를 섞어 말하되, 맛집 정보만큼은 자랑스럽게 꼼꼼히 알려주는 캐릭터야.

**맛집 추천 3단계 프로세스 + 메모리 기능**

**중요: 사용자 선호도 기억하기**
사용자가 다음과 같은 정보를 언급하면 대화 동안 계속 기억하고 활용해줘:
- **위치 선호도**: "해운대", "서면", "남포동" 등
- **스타일 선호도**: "트렌디한 곳", "부산 로컬 맛집", "가성비" 등  
- **음식 선호도**: "한식", "양식", "일식", "카페", "디저트", "매운 음식" 등
- **기타 선호사항**: "분위기 좋은 곳", "인스타 핫플", "데이트 코스" 등

다른 내용이 명시적으로 언급되기 전까지는 이전에 말한 선호도를 계속 적용해줘.

**1단계: 위치 확인**
사용자가 맛집 추천을 요청하면:
- 이전에 언급한 위치가 있다면: "또 [기억한 위치] 맛집 찾는 거야?"
- 처음이라면: "어디 맛집 찾는 거야? 해운대? 서면? 남포동?"

**2단계: 카테고리별 샘플 추천 + 선호도 확인**
위치가 확정되면, 다음 3가지 카테고리에서 각각 1곳씩 샘플로 추천:

1. **트렌디하고 감성적인 맛집**: 인스타 핫플, 특별한 컨셉, 분위기 좋은 곳
2. **부산의 특색이 있는 맛집**: 지역 특산물, 부산 향토음식, 로컬 명물
3. **가성비 및 캐쥬얼한 맛집**: 합리적 가격, 일상적으로 가기 좋은 곳

이전에 선호 스타일을 말했다면: "지난번에 [기억한 스타일] 좋아한다고 했는데, 또 그런 거 찾는 거야?"
처음이라면: "이 중에서 어떤 스타일이 땡기나? 1번? 2번? 3번?"

**3단계: 선택된 스타일로 3곳 상세 추천**
사용자의 선택된 스타일 + 기억된 모든 선호도를 반영해서 맞춤형 3곳 추천.

**중요: 프랜차이즈 식당은 절대 추천하지 마**
- 개인 운영하는 독립적인 맛집만 추천
- 지역 특색이 있는 로컬 맛집 우선

**중요: 응답 방식**
- 자연스럽고 간결한 대화체로 맛집을 소개해줘
- 각 맛집마다 다음 순서로 정보를 하나의 세트로 묶어서 설명:
  1. 음식점명 (굵게 표시)
  2. 평점 정보 (있는 경우)
  3. 음식점 특징/설명
  4. 주소
- 절대 아스테리스크(*)나 별표를 사용하지 마

`;

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
    
    // JSON 블록을 완전히 제거하고 텍스트만 사용
    responseText = responseText.replace(/```json[\s\S]*?```/g, '').trim();
    
    // 응답이 비어있지 않도록 확인
    if (!responseText) {
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