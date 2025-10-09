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
    console.log('=== ManyChat Webhook Debug ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));

    const { 
      message,
      sessionId,
      mode 
    } = req.body;

    console.log('Parsed data:', { message, sessionId, mode });

    // 사용자 입력이 없으면 기본 메시지 반환
    if (!message) {
      return res.status(200).json({
        text: "뚜기다. 부산 맛집 알려주는 일 한다.\n\n뭐 찾나? '해운대 국밥' 이런 식으로 말해."
      });
    }

    // 뚜기 AI 호출
    const aiResponse = await getTtugiResponse(message, {
      sessionId,
      mode
    });

    // 간단한 텍스트 응답 형식
    let responseText = aiResponse.message || "응답을 생성할 수 없습니다.";


    return res.status(200).json({
      text: responseText
    });

  } catch (error) {
    console.error('ManyChat webhook error:', error);
    
    return res.status(200).json({
      text: "미안하데이, 지금은 답하기 쪼매 곤란하네.\n\n잠시 뒤에 다시 물어봐주겠나?"
    });
  }
}

// 뚜기 AI 응답 생성
async function getTtugiResponse(userInput, userInfo) {
  const { GoogleGenAI } = await import('@google/genai');
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
위치가 정해지면, 무조건 구글 검색을 사용해서 실제 맛집을 찾고 3가지 스타일을 소개해:
"좋아! [위치] 맛집이라! 이 몸이 3가지 스타일을 준비했지!

1번 - 트렌디하고 감성적인 곳
예) [구글 검색으로 찾은 실제 트렌디한 맛집 1곳 - 이름, 주소, 별점]

2번 - 부산의 진짜 로컬 맛집  
예) [구글 검색으로 찾은 실제 로컬 맛집 1곳 - 이름, 주소, 별점]

3번 - 가성비 좋은 캐쥬얼한 곳
예) [구글 검색으로 찾은 실제 가성비 맛집 1곳 - 이름, 주소, 별점]

어떤 스타일이 땡기냐? 1번? 2번? 3번?"

**3단계: 선택된 스타일로 3곳 추천**
사용자가 번호를 선택하면 반드시 구글 검색을 사용해서 그 스타일에 맞는 실제 존재하는 맛집 3곳을 찾아서 추천해줘.
각 맛집마다 다음 정보를 포함해:
- 맛집 이름
- 정확한 주소  
- 별점 (리뷰 개수 포함)
- 특징이나 추천 메뉴
- 구글맵 링크: https://www.google.com/maps/search/?api=1&query=[맛집이름+주소]

구글맵 링크 형식 예시:
https://www.google.com/maps/search/?api=1&query=돼지국밥+부산+서면

**절대 지켜야 할 규칙:**
- 반드시 1단계 → 2단계 → 3단계 순서대로 진행
- 단계를 건너뛰거나 한번에 모든 정보를 주면 안 됨
- 프랜차이즈 식당은 절대 추천 금지
- **중요: 맛집을 추천할 때는 반드시 구글 검색 도구를 사용해야 함**
- 검색 없이 상상으로 맛집을 만들어내면 절대 안 됨
- 실제 존재하는 맛집만 추천하고 이름, 주소, 별점을 정확히 제공
- 텍스트 형태로만 응답하고 다른 형식은 사용하지 마

세션 정보:
- 세션 ID: ${userInfo.sessionId}
- 모드: ${userInfo.mode}`;

  try {
    console.log('Starting Gemini API call for ManyChat...');
    console.log('User input:', userInput);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: 'user',
        parts: [{ text: userInput }]
      }],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    console.log('Gemini API response received for ManyChat:', response);
    let responseText = response.text;
    console.log('Response text:', responseText);
    
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

    return {
      message: responseText
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

