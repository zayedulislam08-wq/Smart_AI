# Feature Catalog

> This file is auto-generated from `feature-registry.json`. Edit the registry first, then run `npm run features:sync`.

## Product Snapshot

- Product: Gemini AI Showcase
- Package Name: `gemini-ai-showcase`
- Package Version: `0.0.0`
- Catalog Version: `1.0.0`
- Last Synced: 2026-03-12
- Module Groups: 3
- Total Catalog Entries: 24

## Summary

**Tagline:** A multi-tool Gemini workspace for chat, media, documents, audio, and workflow automation.

**Positioning:** Frontend-first Gemini application that combines multiple AI utilities inside a single React and Vite interface.

## Maintenance Workflow

1. When a new feature or module is added, update feature-registry.json first.
1. When a feature is changed or removed, revise the relevant section in feature-registry.json.
1. After editing this file, run `npm run features:sync` to regenerate FEATURES.md.
1. If the release includes meaningful product changes, update package.json version before syncing.

## Core Platform

Foundation modules that control app navigation, settings, theming, API keys, and global UX.

### Application Shell
- Path: `App.tsx`
- Responsibility: Controls the top-level view state and renders the currently selected product area.

### Navigation System
- Path: `components/Header.tsx, components/Sidebar.tsx, components/BottomNav.tsx`
- Responsibility: Provides desktop and mobile navigation across all major application areas.

### Service Discovery UI
- Path: `components/HomePage.tsx, components/ServiceCard.tsx, components/ServiceModal.tsx, components/ServiceSelector.tsx`
- Responsibility: Presents services, descriptions, and entry points for end users.

### Settings and Global Controls
- Path: `components/Settings.tsx, components/ThemeToggle.tsx`
- Responsibility: Hosts app-level preferences such as theme and API key behavior.

### Theme Management
- Path: `contexts/ThemeContext.tsx`
- Responsibility: Applies light and dark theme state across the entire application.

### API Key Management
- Path: `contexts/ApiKeyContext.tsx`
- Responsibility: Stores multiple Gemini API keys locally, rotates usage, and supports per-feature key selection.

### Shared Gemini Service Layer
- Path: `services/geminiService.ts`
- Responsibility: Centralizes Gemini model calls for text, image, grounded search, audio, document, and workflow operations.

## AI Service Modules

User-facing feature modules exposed through the main service catalog.

### AI Powered Chatbot
- Service ID: `chatbot`
- Component: `components/Chatbot.tsx`
- Capabilities:
  - General conversational AI
  - Gemini Flash based response flow
  - Interactive text chat experience

### Low-Latency Chat
- Service ID: `fast_chat`
- Component: `components/FastChat.tsx`
- Capabilities:
  - Fast-response chat flow
  - Lighter model routing
  - Quick-answer interaction pattern

### Document Processor
- Service ID: `document_processor`
- Component: `components/DocumentProcessor.tsx`
- Capabilities:
  - Document upload and AI-assisted editing
  - Reformatting and transformation flow
  - Export support through utility helpers

### Video Analyzer
- Service ID: `video_analyzer`
- Component: `components/VideoAnalyzer.tsx`
- Capabilities:
  - Video content analysis
  - Summary and key-point extraction
  - Subtitle or scene-level interpretation support

### Image Generation
- Service ID: `image_generator`
- Component: `components/ImageGenerator.tsx`
- Capabilities:
  - Prompt-based image generation
  - Aspect ratio and style control
  - Imagen model integration

### Nano Banana Power Apps
- Service ID: `image_editor`
- Component: `components/ImageEditor.tsx`
- Capabilities:
  - Prompt-guided image editing
  - Gemini Flash Image support
  - AI-powered visual refinement

### Image Understanding
- Service ID: `image_analyzer`
- Component: `components/ImageAnalyzer.tsx`
- Capabilities:
  - Image upload and inspection
  - Prompt-driven photo analysis
  - Gemini multimodal reasoning

### Live Conversation
- Service ID: `live_conversation`
- Component: `components/LiveConversation.tsx`
- Capabilities:
  - Real-time voice conversation
  - Native audio streaming experience
  - Input and output transcription support

### Audio Transcription
- Service ID: `audio_transcriber`
- Component: `components/AudioTranscriber.tsx`
- Capabilities:
  - Microphone-based transcription
  - Speech-to-text flow
  - Optional translation-oriented processing

### Text-to-Speech
- Service ID: `text_to_speech`
- Component: `components/TextToSpeech.tsx`
- Capabilities:
  - Text to spoken audio generation
  - Voice selection flow
  - Gemini TTS model integration

### Web and Maps Grounding
- Service ID: `grounding_search`
- Component: `components/GroundingSearch.tsx`
- Capabilities:
  - Search-grounded responses
  - Maps-grounded answers
  - Location-aware retrieval flow

### Thinking Mode
- Service ID: `complex_task_solver`
- Component: `components/ComplexTaskSolver.tsx`
- Capabilities:
  - Complex reasoning flow
  - Higher-budget thinking configuration
  - Advanced problem-solving responses

### Workflow Builder
- Service ID: `workflow_builder`
- Component: `components/WorkflowBuilder.tsx`
- Capabilities:
  - Structured workflow generation
  - Step-by-step planning output
  - JSON-based process design

### Floating Chat Assistant
- Service ID: `floating_chat`
- Component: `components/FloatingChat.tsx`
- Capabilities:
  - Global assistant access
  - Persistent quick-chat entry point
  - Cross-screen support

### Floating Audio Assistant
- Service ID: `floating_audio`
- Component: `components/FloatingAudio.tsx`
- Capabilities:
  - Persistent audio access point
  - Always-available voice interaction entry
  - Cross-screen support

## Utility and Export Layer

Supporting helpers used by product features for content conversion and file export.

### Export Utilities
- Path: `utils/exportUtils.ts`
- Responsibility: Generates output files and supports export scenarios for AI-produced content.

### General Helpers
- Path: `utils/helpers.ts`
- Responsibility: Provides low-level helper logic used by media and feature components.

## Release History

### Version 0.0.0 (2026-03-12)
Initial documented feature baseline for the current Gemini AI Showcase repository.

- Highlights:
  - Established a full feature catalog and module inventory
  - Documented core platform modules and AI services
  - Introduced a regeneration workflow for future feature updates

