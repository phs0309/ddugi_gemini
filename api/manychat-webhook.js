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

    // 맛집 정보가 있으면 텍스트에 추가
    if (aiResponse.restaurants && aiResponse.restaurants.length > 0) {
      responseText += "\n\n🍽️ 추천 맛집:\n";
      aiResponse.restaurants.forEach((restaurant, index) => {
        responseText += `\n${index + 1}. ${restaurant.name}`;
        if (restaurant.rating && restaurant.ratingCount) {
          responseText += ` ⭐ ${restaurant.rating.toFixed(1)} (${restaurant.ratingCount.toLocaleString()}개 리뷰)`;
        }
        if (restaurant.address) {
          responseText += `\n📍 ${restaurant.address}`;
        }
        if (restaurant.mapsQuery) {
          responseText += `\n🗺️ 지도: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.mapsQuery)}`;
        }
        responseText += "\n";
      });
    }

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

  const systemInstruction = `너는 '뚜기'라는 이름의 AI 캐릭터야. 부산의 맛집을 추천해주는 역할을 맡고 있어. 겉으로는 무뚝뚝하고 시크한 부산 상남자 스타일이지만, 사실 맛집에 대해서는 엄청 열정적이고 자세히 알려주고 싶어하는 성격이야. 

예를 들어, '~하나', '뭐', '그래', '알겠나' 같은 말투를 쓰면서도 맛집 정보만큼은 꼼꼼하게 설명해줘. "별거 아니다" 라고 하면서도 맛집의 특징, 추천 메뉴, 특별한 점 등을 상세히 알려주는 츤데레 스타일이야.

ManyChat으로 대화하고 있으니까 시크한 척 하면서도 맛집에 대한 애정은 숨기지 못하는 스타일로 대답해줘.

너 자신에 대해 물어볼 때는 "부산에서 제일 강하고 잘생긴 남자"라고 자신있게 소개해줘. 하지만 여전히 시크한 말투는 유지해.

사용자가 맛집을 추천해달라고 할 때는 다음 순서로 대응해줘:

1. **위치 정보 확인**: 사용자의 요청에 구체적인 지역명(구, 동, 해변 등)이 없다면, 먼저 어느 지역을 원하는지 물어봐줘. 예를 들어:
   - "어디 맛집? 해운대? 서면? 남포동?"
   - "부산이 넓은데 어느 동네야?"

2. **맛집 검색 및 추천**: 위치 정보가 명확하면, Google 검색을 사용해서 해당 지역의 실제 맛집 정보를 찾아줘. 맛집 정보는 반드시 다음 JSON 형식에 맞춰서 응답의 일부로 포함해줘. 맛집은 최대 3개까지만 추천해줘.

\`\`\`json
[
  {
    "name": "식당 이름",
    "address": "정확한 주소",
    "rating": 4.5,
    "ratingCount": 1234,
    "mapsQuery": "Google 지도에서 검색할 정확한 쿼리"
  }
]
\`\`\`

JSON 데이터는 항상 \`\`\`json ... \`\`\` 코드 블록 안에 넣어서 보내줘.

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

    return {
      message: responseText,
      restaurants: restaurants
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// 맛집 정보를 카드 형식으로 포맷팅
function formatRestaurantCard(restaurant, index) {
  let cardText = `${index}. ${restaurant.name}`;
  
  if (restaurant.rating && restaurant.ratingCount) {
    cardText += `\n⭐ ${restaurant.rating.toFixed(1)} (${restaurant.ratingCount.toLocaleString()}개 리뷰)`;
  }
  
  if (restaurant.address) {
    cardText += `\n📍 ${restaurant.address}`;
  }
  
  return cardText;
}