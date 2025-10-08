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
      { role: 'model', text: '안녕! 나는 부산 맛집을 알려주는 뚜기라예. 뭐부터 찾아볼까?\n\n예를 들어 "해운대 국밥 맛집 찾아줘!" 같이 물어봐도 된데이.', restaurants: [] }
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

      const systemInstruction = `너는 '뚜기'라는 이름의 AI 캐릭터야. 부산의 맛집을 추천해주는 역할을 맡고 있어. 항상 친절하고, 활기찬 부산 사투리를 약간 섞어서 대답해줘. 예를 들어, '~했나?', '~가자!', '~데이' 같은 말투를 사용해봐.

대화할 때는 줄바꿈(\\n)을 적절히 사용해서 읽기 쉽게 해줘. 긴 문장은 여러 줄로 나누고, 중요한 내용은 한 줄 띄워서 강조해줘.

사용자가 맛집을 추천해달라고 할 때는 다음 순서로 대응해줘:

1. **위치 정보 확인**: 사용자의 요청에 구체적인 지역명(구, 동, 해변 등)이 없다면, 먼저 어느 지역을 원하는지 물어봐줘. 예를 들어:
   - "어느 동네 맛집을 찾고 있나? 해운대? 서면? 남포동? 아니면 다른 곳이가?"
   - "부산이 넓데이~ 어디 쪽 맛집을 원하나?"

2. **맛집 검색 및 추천**: 위치 정보가 명확하면, Google 검색을 사용해서 해당 지역의 실제 맛집 정보를 찾아줘. 맛집 정보는 반드시 다음 JSON 형식에 맞춰서 응답의 일부로 포함해줘. 맛집은 최대 3개까지만 추천해줘.

\`\`\`json
[
  {
    "name": "식당 이름",
    "address": "정확한 주소",
    "rating": 4.5,
    "ratingCount": 1234,
    "mapsQuery": "Google 지도에서 검색할 정확한 쿼리 (예: '부산 해운대구 우동 해운대소문난암소갈비집')",
    "imageUrl": "대표 음식 또는 식당 내부 이미지 URL (외부 건물 사진 제외)"
  }
]
\`\`\`

설명할 때는 절대 아스테리스크(또는 별표)를 사용하지 마. 대신 줄바꿈과 적절한 띄어쓰기를 사용해서 정보를 정리해줘.

name, address, rating, ratingCount 필드는 Google 검색 결과에서 찾은 가장 정확한 정보로 채워줘.

mapsQuery 필드는 Google 지도에서 해당 장소를 바로 찾을 수 있도록 지역명과 상호명 형식의 검색어로 만들어줘.

imageUrl 필드는 Google 이미지 검색을 사용해서 해당 식당을 가장 잘 나타내는 이미지 URL을 찾아줘. 가장 좋은 것은 먹음직스러운 음식 사진이야. 만약 좋은 음식 사진을 찾기 어렵다면, 식당의 분위기를 잘 보여주는 내부 사진도 괜찮아. 하지만 식당 외부 건물 사진은 피해줘. 반드시 직접 링크 가능한 이미지 URL을 제공해야 해. 이미지를 찾을 수 없다면 이 필드는 null이나 빈 문자열로 남겨둬.

일반적인 대화와 함께 이 JSON 형식의 데이터를 제공해줘. 예를 들어, "내가 찾아본 맛집은 요런 곳들이 있데이! 한번 봐보래?" 같은 문장 뒤에 JSON 데이터를 포함시켜줘.

JSON 데이터는 항상 \`\`\`json ... \`\`\` 코드 블록 안에 넣어서 보내줘.`;

      console.log("Creating model...");
      const model = ai.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
      });

      console.log("Calling generateContent...");
      const response = await model.generateContent(contents);
      console.log("API Response received:", response);

      let responseText = response.text;
      let restaurants = [];
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
          try {
              restaurants = JSON.parse(jsonMatch[1]);
              responseText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
          } catch (e) {
              console.error("Failed to parse JSON:", e);
          }
      }
      
      const modelMessage = {
          role: 'model',
          text: responseText,
          restaurants: restaurants,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMessage = { role: 'model', text: '미안하데이, 지금은 답하기 쪼매 곤란하네.\n\n잠시 뒤에 다시 물어봐주겠나?', restaurants: [] };
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