# Gemini AI Showcase

A polished multi-tool Gemini web app built with React, TypeScript, and Vite. The project combines chat, image generation, image editing, document processing, transcription, grounding search, text-to-speech, workflow generation, and live audio experiences in one interface.

## Highlights

- Multi-feature Gemini workspace with service-based navigation
- Multiple API keys with local rotation and per-feature configuration
- Chat, fast chat, and complex-task reasoning flows
- Image generation, image editing, and image analysis tools
- Audio transcription, text-to-speech, and live conversation features
- Document processing and export utilities
- Web and Maps grounded search support

## Tech Stack

- React 19
- TypeScript
- Vite
- `@google/genai`
- `jspdf`, `html2canvas`, `docx`, `mammoth`, `pptxgenjs`

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- A Gemini API key

### Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file:
   ```bash
   copy .env.example .env.local
   ```
3. Set `VITE_GEMINI_API_KEY` in `.env.local`
4. Start the app:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```text
components/   UI features and shared components
contexts/     Theme and API key state management
services/     Gemini API integration layer
utils/        Export and helper utilities
```

## Notes

- `.env.local` is ignored by Git and should never be committed.
- The production build succeeds, but Vite currently reports a large chunk warning because several heavy client-side libraries are bundled together.
