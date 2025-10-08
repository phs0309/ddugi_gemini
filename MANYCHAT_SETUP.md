# ManyChat 연동 설정 가이드

## 개요
뚜기 맛집 추천 AI를 ManyChat Instagram DM 봇으로 연동하는 방법입니다.

## 1. 필요한 환경 변수

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Gemini API (기존)
GEMINI_API_KEY=your_gemini_api_key
```

## 2. ManyChat 설정

### 2.1 ManyChat 계정 생성
1. [ManyChat.com](https://manychat.com)에서 계정 생성
2. Instagram 계정 연결 (비즈니스 계정 필요)
3. Instagram 페이지와 연결

### 2.2 External Request 설정

#### Step 1: Flow 생성
1. ManyChat 대시보드에서 **"Flows"** 메뉴 클릭
2. **"New Flow"** 버튼으로 새 플로우 생성
3. 플로우 이름: "뚜기 맛집 추천"

#### Step 2: Trigger 설정
1. **"Keywords"** 트리거 추가
2. 키워드 설정:
   - `맛집`, `추천`, `뚜기`, `음식`, `식당`
   - 또는 **"Default Reply"**로 설정하여 모든 메시지에 반응

#### Step 3: External Request Action 추가
1. **"Actions"** → **"External Request"** 선택
2. 설정값:

```
Request Type: POST
Request URL: https://your-vercel-app.vercel.app/api/manychat-webhook
Headers: Content-Type: application/json

Request Body (JSON):
{
  "user_input": "{{last_input_text}}",
  "user_id": "{{contact_id}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "profile_pic": "{{profile_pic_url}}",
  "locale": "{{locale}}"
}
```

#### Step 4: Response 처리
1. **"Set Contact Field"** Action 추가 (선택사항)
2. **"Send Message"** Action 추가
3. 메시지 내용: `{{external_request.content.messages}}`

### 2.3 Advanced Settings

#### Custom Field 설정 (선택사항)
1. **"Settings"** → **"Custom Fields"** 
2. 새 필드 추가:
   - `last_restaurant_query` (마지막 검색어 저장)
   - `preferred_location` (선호 지역 저장)

#### Growth Tools 설정
1. **"Growth Tools"** → **"Welcome Message"**
2. 환영 메시지 설정:
   ```
   안녕! 나는 부산 맛집을 알려주는 뚜기라예 🍽️
   
   뭐부터 찾아볼까?
   
   예: "해운대 국밥 맛집 찾아줘!"
   ```

## 3. 응답 형식

### 3.1 뚜기 응답 예시
사용자가 "해운대 국밥집"이라고 보내면:

```
해운대 국밥집 찾아봤데이!

1. 해운대할매국밥
⭐ 4.3 (1,245개 리뷰)  
📍 부산 해운대구 중동 1394-65

[이미지]

🗺️ 해운대할매국밥 지도에서 보기
[지도 보기 버튼]
```

### 3.2 위치 확인 예시
사용자가 "맛집 추천해줘"라고 보내면:

```
어느 동네 맛집을 찾고 있나? 
해운대? 서면? 남포동?

부산이 넓데이~ 어디 쪽이가?
```

## 4. 배포 및 테스트

### 4.1 Vercel 배포
```bash
# 기존 프로젝트에 추가
vercel --prod

# 배포 후 URL 확인
# 예: https://your-app.vercel.app
```

### 4.2 웹훅 URL 설정
ManyChat External Request URL:
```
https://your-vercel-app.vercel.app/api/manychat-webhook
```

### 4.3 테스트 방법
1. ManyChat **"Test Your Bot"** 기능 사용
2. 실제 Instagram DM으로 테스트:
   - Instagram에서 연결된 계정으로 DM 전송
   - "맛집 추천해줘" 메시지 전송
   - 뚜기 응답 확인

## 5. 고급 기능

### 5.1 Quick Replies 활용
```json
{
  "type": "text",
  "text": "어느 지역 맛집을 찾고 있나?",
  "quick_replies": [
    {"type": "text", "caption": "해운대"},
    {"type": "text", "caption": "서면"}, 
    {"type": "text", "caption": "광안리"},
    {"type": "text", "caption": "남포동"}
  ]
}
```

### 5.2 Sequence 연결
1. 위치 확인 → 음식 종류 확인 → 맛집 추천
2. 각 단계별 Sequence 생성
3. 조건부 분기로 연결

### 5.3 Analytics 활용
1. **"Analytics"** 메뉴에서 사용 통계 확인
2. 인기 검색어, 사용자 패턴 분석
3. 봇 성능 최적화

## 6. 문제 해결

### 6.1 External Request 실패
- **확인사항**:
  - Vercel 배포 상태
  - `GEMINI_API_KEY` 환경 변수
  - 웹훅 URL 정확성

### 6.2 응답 형식 오류  
- **로그 확인**: Vercel Functions 로그
- **테스트**: `/api/manychat-webhook` 직접 호출

### 6.3 Instagram 연결 문제
- **비즈니스 계정** 필수
- **페이지 관리자 권한** 확인
- **ManyChat 권한** 재설정

## 7. 제한사항

### 7.1 ManyChat 제한
- 무료 플랜: 월 1,000개 메시지
- 유료 플랜 필요 시 업그레이드

### 7.2 Instagram 제한
- 24시간 메시지 창 제한
- 스팸 필터링 주의

### 7.3 API 제한
- Gemini API 할당량
- Vercel Serverless 실행 시간 (10초)

## 8. 모니터링

### 8.1 사용량 추적
- ManyChat Analytics
- Vercel Functions 로그
- Gemini API 사용량

### 8.2 성능 최적화
- 응답 시간 모니터링
- 에러율 추적
- 사용자 만족도 조사