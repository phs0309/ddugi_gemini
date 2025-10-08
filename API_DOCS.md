# 뚜기 맛집 추천 API 문서

부산 맛집 추천 AI '뚜기'의 REST API 문서입니다.

## Base URL
```
https://your-vercel-deployment.vercel.app/api
```

## 엔드포인트

### 1. 맛집 추천 API

**POST** `/restaurants`

부산 맛집을 추천받는 메인 API입니다.

#### 요청

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "query": "해운대 국밥 맛집",
  "location": "해운대구" // 선택사항
}
```

#### 응답

**성공 (200):**
```json
{
  "success": true,
  "message": "내가 찾아본 맛집은 요런 곳들이 있데이! 한번 봐보래?",
  "restaurants": [
    {
      "name": "해운대할매국밥",
      "address": "부산 해운대구 중동 1394-65",
      "rating": 4.3,
      "ratingCount": 1250,
      "mapsQuery": "부산 해운대구 해운대할매국밥",
      "imageUrl": "https://example.com/image.jpg"
    }
  ],
  "query": "해운대 국밥 맛집",
  "location": "해운대구"
}
```

**오류 (400):**
```json
{
  "success": false,
  "error": "Query parameter is required"
}
```

**오류 (500):**
```json
{
  "success": false,
  "error": "맛집 정보를 가져오는 중 오류가 발생했습니다.",
  "details": "Error details"
}
```

### 2. 상태 확인 API

**GET** `/health`

API 서버의 상태를 확인합니다.

#### 응답

**성공 (200):**
```json
{
  "success": true,
  "message": "뚜기 API가 정상 작동중이데이!",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 매니쳇 연동 예시

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function getRestaurantRecommendations(query, location) {
  try {
    const response = await axios.post('https://your-app.vercel.app/api/restaurants', {
      query: query,
      location: location
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// 사용 예시
getRestaurantRecommendations('해운대 국밥', '해운대구')
  .then(data => {
    console.log('추천 맛집:', data.restaurants);
  });
```

### Python
```python
import requests

def get_restaurant_recommendations(query, location=None):
    url = "https://your-app.vercel.app/api/restaurants"
    payload = {"query": query}
    if location:
        payload["location"] = location
    
    response = requests.post(url, json=payload)
    return response.json()

# 사용 예시
result = get_restaurant_recommendations("서면 치킨", "부산진구")
print(f"추천 맛집: {result['restaurants']}")
```

### cURL
```bash
# 맛집 추천
curl -X POST https://your-app.vercel.app/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{"query": "광안리 해산물", "location": "수영구"}'

# 상태 확인
curl https://your-app.vercel.app/api/health
```

## 매개변수 설명

- **query** (필수): 찾고 싶은 맛집이나 음식 종류
  - 예: "국밥", "해운대 맛집", "회 맛집", "디저트 카페"
  
- **location** (선택): 구체적인 지역 지정
  - 예: "해운대구", "서면", "광안리", "남포동"

## 응답 데이터 설명

- **message**: 뚜기의 친근한 추천 메시지
- **restaurants**: 추천 맛집 배열
  - **name**: 식당 이름
  - **address**: 주소
  - **rating**: 평점 (1-5)
  - **ratingCount**: 리뷰 수
  - **mapsQuery**: Google 지도 검색용 쿼리
  - **imageUrl**: 대표 이미지 URL

## 오류 처리

- 400: 잘못된 요청 (query 누락 등)
- 405: 허용되지 않은 HTTP 메서드
- 500: 서버 내부 오류 (API 키 문제, Gemini API 오류 등)

## 제한사항

- Rate Limit: Vercel 서버리스 함수 기본 제한
- 응답 시간: 일반적으로 3-10초 (Gemini API 검색 포함)
- 지역: 현재 부산 지역 맛집만 지원