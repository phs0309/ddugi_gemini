# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React-based chatbot application called "뚜기" (Ttugi) that recommends restaurants in Busan, South Korea. The app uses Google's Gemini AI with search capabilities to provide restaurant recommendations with detailed information including ratings, locations, and images.

## Development Commands

### Prerequisites
- Node.js
- Gemini API key (set in `.env.local` as `GEMINI_API_KEY`)

### Common Commands
```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite with React plugin
- **AI Integration**: Google Gemini AI (via @google/genai)
- **Styling**: CSS (index.css)

### Application Structure
- **Single Page App**: All components defined in `index.tsx`
- **AI Integration**: Uses Gemini 2.5 Flash model with Google Search tools
- **Environment**: API key injected via Vite's environment handling

### Key Components
- `App`: Main chat application with message handling
- `RestaurantCard`: Displays restaurant information with ratings and map links  
- `TtugiAvatar`: Chat bot avatar component
- `Sources`: Shows grounding sources from AI responses

### AI System Instruction
The AI is configured as "뚜기", a friendly Busan restaurant guide that:
- Uses casual Busan dialect in responses
- Searches for real restaurant data via Google Search
- Returns structured JSON data for restaurant cards
- Provides restaurant images, ratings, and Google Maps integration

### Data Flow
1. User input → Gemini API with search tools
2. AI response includes both text and structured restaurant JSON
3. JSON extracted and rendered as restaurant cards
4. Sources displayed for transparency

## Important Notes
- Restaurant data is parsed from JSON blocks in AI responses
- Images are handled with error fallbacks
- Google Maps integration via query parameters
- All text is in Korean for Busan local context