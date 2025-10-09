/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import './index.css';

const TtugiAvatar = () => (
  <div className="avatar">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#FF8E53"/>
      <path d="M9 14.5C9.83 15.54 10.88 16 12 16C13.12 16 14.17 15.54 15 14.5C15.15 14.33 15.3 14.17 15.43 14H8.57C8.7 14.17 8.85 14.33 9 14.5Z" fill="#FF8E53"/>
      <circle cx="8.5" cy="10.5" r="1.5" fill="#333"/>
      <circle cx="15.5" cy="10.5" r="1.5" fill="#333"/>
    </svg>
  </div>
);

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/>
  </svg>
);

const StarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
);

const MapPinIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const RestaurantCard = ({ restaurant }) => {
    const [imageSrc, setImageSrc] = useState(restaurant.imageUrl);

    useEffect(() => {
        setImageSrc(restaurant.imageUrl);
    }, [restaurant.imageUrl]);

    const handleImageError = () => {
        setImageSrc(null);
    };

    return (
        <div className="restaurant-card">
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={`${restaurant.name} 사진`}
                    className="restaurant-thumbnail"
                    onError={handleImageError}
                />
            ) : (
                <div className="restaurant-thumbnail placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
            )}
            <div className="restaurant-info">
                <h3>{restaurant.name}</h3>
                {restaurant.address && <p className="address">{restaurant.address}</p>}
                {restaurant.description && <p className="description">{restaurant.description}</p>}
                {restaurant.rating && restaurant.ratingCount && (
                    <div className="rating">
                        <StarIcon />
                        <span>{restaurant.rating.toFixed(1)}</span>
                        <span className="rating-count">({restaurant.ratingCount.toLocaleString()})</span>
                    </div>
                )}
            </div>
            {restaurant.mapsQuery && (
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                    aria-label={`${restaurant.name} 지도에서 보기`}
                >
                    <MapPinIcon />
                    <span>지도</span>
                </a>
            )}
        </div>
    );
};





const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const [csvRestaurants, setCsvRestaurants] = useState([]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  // CSV 데이터 로드
  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        const response = await fetch('./비짓부산_cleaned_reviews.csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const restaurants = [];
        
        // 처음 100개만 파싱 (성능 개선)
        const maxRows = Math.min(100, lines.length - 1);
        
        for (let i = 1; i <= maxRows; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // 간단한 CSV 파싱
          const values = line.split(',');
          
          if (values.length >= 25) {
            // 카드에 필요한 정보만 추출: 이름, 주소, 평점, 평점개수, 이미지 URL
            const restaurant = {
              name: (values[1] || values[20] || '').replace(/"/g, ''),
              address: (values[8] || values[23] || '').replace(/"/g, ''),
              rating: parseFloat(values[21]) || 0,
              ratingCount: parseInt(values[22]) || 0,
              imageUrl: (values[24] || '').replace(/"/g, '') // 이미지 URL 필드 추가
            };
            
            if (restaurant.name && restaurant.name.trim()) {
              restaurants.push(restaurant);
            }
          }
        }
        
        setCsvRestaurants(restaurants);
        console.log(`Loaded ${restaurants.length} restaurants from CSV`);
      } catch (error) {
        console.error('Failed to load restaurant data:', error);
        // CSV 로드 실패해도 Google 검색은 계속 작동
        setCsvRestaurants([]);
      }
    };
    
    loadRestaurantData();
  }, []);

  useEffect(() => {
    setMessages([
      { role: 'model', text: '이 몸이 바로 부산 최고의 영웅 뚜기다!!\n\n맛집 찾는 거? 뚜기에게 맡겨! 알려주지!!\n\n"해운대 카페" 이런 식으로 말해 봐. 어떠냐?', restaurants: [] }
    ]);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input, restaurants: [] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      console.log("Starting API call...");
      
      const contents = newMessages
        .filter(msg => msg.text)
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

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
- "뭐... 별거 아니지만 이런 곳들이 괜찮나?" 같은 시크한 말투로 시작하고 끝내기

**데이터 제공 방식**
맛집 추천 시 응답 끝에 다음 JSON 형식으로 맛집 정보를 포함해줘:

\`\`\`json
[
  {
    "name": "식당 이름",
    "address": "정확한 주소", 
    "rating": 4.5,
    "ratingCount": 1234,
    "description": "특징이나 추천 이유",
    "mapsQuery": "지역명 + 상호명"
  }
]
\`\`\`

`;

      console.log("Calling generateContent...");
      const model = ai.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
      });
      const response = await model.generateContent(contents);
      console.log("API Response received:", response);

      let responseText = response.response.text();
      let restaurants = [];
      
      // 다양한 형태의 JSON 블록을 찾아서 파싱
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
          try {
              restaurants = JSON.parse(jsonMatch[1]);
              console.log("Parsed restaurants:", restaurants);
          } catch (e) {
              console.error("Failed to parse JSON:", e);
          }
      }
      
      // 모든 JSON 블록을 응답에서 완전히 제거
      responseText = responseText.replace(/```json[\s\S]*?```/g, '').trim();
      
      // 응답이 비어있지 않도록 확인
      if (!responseText) {
          responseText = "어... 뚜기가 지금 좀 말이 안 나오네! 다시 물어봐!";
      }
      
      const modelMessage = {
          role: 'model',
          text: responseText,
          restaurants: restaurants,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMessage = { role: 'model', text: '어... 어라? 뚜기가 지금 좀... 아니다! 있다가 얘기해줄게게!!\n\n잠깐만 기다려! 뚜기가 다시 알려줄게!', restaurants: [] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log("Setting loading to false");
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-app">
      <header>
        <h1>부산 맛집 탐험가, 뚜기</h1>
      </header>
      <main ref={chatContainerRef} className="chat-container" aria-live="polite">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            {msg.role === 'model' && <TtugiAvatar />}
            <div className="message-content">
              {msg.text && <div className="message-bubble" style={{whiteSpace: 'pre-line'}}>{msg.text}</div>}
              
              {msg.restaurants && msg.restaurants.length > 0 && (
                <div className="restaurants-container">
                    {msg.restaurants.map((resto, i) => (
                        <RestaurantCard key={i} restaurant={resto} />
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper model">
            <TtugiAvatar />
            <div className="message-bubble loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </main>
      <footer>
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="뚜기에게 물어보세요..."
            disabled={isLoading}
            aria-label="채팅 메시지 입력"
          />
          <button type="submit" disabled={isLoading || !input.trim()} aria-label="메시지 전송">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}