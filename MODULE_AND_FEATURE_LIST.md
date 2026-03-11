# Module And Feature List

This document lists the current modules in the project and the features that are already present in the current codebase.

## 1. Core System Modules

### 1.1 Application Shell
- Module/File: `App.tsx`
- Current Features:
  - Controls top-level view switching between home, workflow, service, and settings
  - Tracks currently selected service
  - Renders desktop sidebar and mobile bottom navigation
  - Keeps floating AI assistants globally available

### 1.2 Home and Service Discovery
- Module/Files: `components/HomePage.tsx`, `components/ServiceCard.tsx`, `components/ServiceModal.tsx`, `components/ServiceSelector.tsx`, `components/Welcome.tsx`
- Current Features:
  - Displays service catalog
  - Shows service names and descriptions
  - Provides entry point to launch specific service modules
  - Supports service browsing from the home area

### 1.3 Header, Sidebar, and Bottom Navigation
- Module/Files: `components/Header.tsx`, `components/Sidebar.tsx`, `components/BottomNav.tsx`
- Current Features:
  - Desktop navigation
  - Mobile navigation
  - View switching across app sections
  - Persistent navigation controls

### 1.4 Settings and Configuration
- Module/File: `components/Settings.tsx`
- Current Features:
  - Add multiple Gemini API keys
  - Rename and remove API keys
  - Show or hide stored API keys
  - Detect active and rate-limited keys
  - Configure model per feature
  - Assign specific API keys to specific features
  - Save model routing preferences

### 1.5 API Key Management Context
- Module/File: `contexts/ApiKeyContext.tsx`
- Current Features:
  - Local storage based API key persistence
  - Multiple key support
  - Smart rotation based on usage count
  - Rate limit flagging and cooldown handling
  - Per-feature model and key configuration
  - Environment key seeding through `VITE_GEMINI_API_KEY`

### 1.6 Theme Management
- Module/Files: `contexts/ThemeContext.tsx`, `components/ThemeToggle.tsx`
- Current Features:
  - Light and dark theme support
  - Global theme toggle
  - Theme class applied to the document root

### 1.7 Shared Gemini Service Layer
- Module/File: `services/geminiService.ts`
- Current Features:
  - Chat session creation
  - General content generation
  - Multimodal prompt handling with media
  - Image generation
  - Image editing
  - Grounded search and maps calls
  - Text-to-speech generation
  - Live audio session connection
  - Audio transcription
  - Summarization
  - Complex reasoning support
  - Workflow generation in JSON
  - Document transformation support
  - Content conversion to CSV, Markdown, and plaintext

## 2. Main AI Modules

### 2.1 AI Powered Chatbot
- Module/File: `components/Chatbot.tsx`
- Current Features:
  - Multi-turn chat interface
  - Gemini text conversation flow
  - User and model message handling
  - Basic conversational assistant experience

### 2.2 Low-Latency Chat
- Module/File: `components/FastChat.tsx`
- Current Features:
  - Faster chat interaction path
  - Lightweight model usage
  - Quick-response conversational workflow

### 2.3 Live Conversation
- Module/File: `components/LiveConversation.tsx`
- Current Features:
  - Real-time voice interaction
  - Audio input and output flow
  - Live Gemini native audio connection
  - Input and output transcription support

### 2.4 Image Generation
- Module/File: `components/ImageGenerator.tsx`
- Current Features:
  - Prompt-to-image generation
  - Aspect ratio selection
  - Style prompt support
  - Negative prompt support
  - Imagen model based generation

### 2.5 Image Editor
- Module/File: `components/ImageEditor.tsx`
- Current Features:
  - Prompt-driven image editing
  - Gemini image editing flow
  - Edited image output generation
  - Download-oriented result handling

### 2.6 Image Analyzer
- Module/File: `components/ImageAnalyzer.tsx`
- Current Features:
  - Image upload and analysis
  - Prompt-based visual understanding
  - Multimodal interpretation
  - Visual Q and A style interaction

### 2.7 Web and Maps Grounding
- Module/File: `components/GroundingSearch.tsx`
- Current Features:
  - Search-grounded responses
  - Maps-grounded responses
  - Real-time external information retrieval
  - Optional location-aware query flow

### 2.8 Audio Transcription
- Module/File: `components/AudioTranscriber.tsx`
- Current Features:
  - Audio recording support
  - Audio file processing
  - Speech-to-text transcription
  - Optional translation direction in transcription prompt

### 2.9 Text-to-Speech
- Module/File: `components/TextToSpeech.tsx`
- Current Features:
  - Text-to-audio conversion
  - Voice selection support
  - Single-speaker generation
  - Multi-speaker generation path
  - Audio playback/output flow

### 2.10 Thinking Mode
- Module/File: `components/ComplexTaskSolver.tsx`
- Current Features:
  - Complex prompt solving
  - Higher reasoning budget usage
  - Gemini Pro based problem solving
  - Long-form answer generation

### 2.11 Document Processor
- Module/File: `components/DocumentProcessor.tsx`
- Current Features:
  - Document upload
  - AI-assisted content editing
  - Reformatting support
  - Content conversion support
  - Export workflow through utilities

### 2.12 Video Analyzer
- Module/File: `components/VideoAnalyzer.tsx`
- Current Features:
  - Video frame analysis
  - Summary generation
  - Key-point extraction
  - Subtitle-style interpretation support

### 2.13 Workflow Builder
- Module/File: `components/WorkflowBuilder.tsx`
- Current Features:
  - Goal-based workflow generation
  - JSON workflow parsing
  - Workflow display with title, summary, and steps
  - CSV import
  - TXT export
  - CSV export

## 3. Floating and Quick Access Modules

### 3.1 Floating Chat
- Module/File: `components/FloatingChat.tsx`
- Current Features:
  - Floating assistant entry point
  - Quick global access to chat behavior
  - Cross-screen assistant availability

### 3.2 Floating Audio
- Module/File: `components/FloatingAudio.tsx`
- Current Features:
  - Floating audio interaction entry point
  - Quick access to audio-oriented assistant flow

### 3.3 Floating Tools
- Module/File: `components/FloatingTools.tsx`
- Current Features:
  - Openable AI tools panel
  - Service selector
  - Feature preview per service
  - Model override selector
  - Quick launch into a selected service

### 3.4 Floating Action Button
- Module/File: `components/FloatingActionButton.tsx`
- Current Features:
  - Quick action trigger behavior
  - Floating access pattern for user actions

## 4. Shared UI and Utility Modules

### 4.1 Shared Action Components
- Module/Files: `components/common/ActionButton.tsx`, `components/common/LoadingSpinner.tsx`, `components/common/SuggestionChips.tsx`
- Current Features:
  - Reusable action button UI
  - Loading indicator UI
  - Suggestion chip based interaction helpers

### 4.2 Icon System
- Module/File: `components/icons/Icons.tsx`
- Current Features:
  - Centralized icon exports for service and UI components
  - Shared icon usage across the interface

### 4.3 Export and Helper Utilities
- Module/Files: `utils/exportUtils.ts`, `utils/helpers.ts`
- Current Features:
  - Workflow export helpers
  - CSV parsing helpers
  - General utility support for feature modules
  - Content export support across multiple tools

## 5. Current Module Coverage Summary

- Core platform modules are present
- Main Gemini service modules are present
- Settings and model configuration system are present
- Theme management is present
- Floating quick-access tools are present
- Export and helper infrastructure is present
- The project already has a strong module base for future feature expansion
