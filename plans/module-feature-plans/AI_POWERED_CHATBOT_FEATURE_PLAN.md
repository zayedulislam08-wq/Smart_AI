# AI Powered Chatbot Feature Plan

This file is a detailed planning blueprint for the `AI Powered Chatbot` module. It defines how the chatbot can evolve from a basic conversation interface into a more useful work-oriented assistant.

## 1. Module Objective

The `AI Powered Chatbot` should become:

- useful for repeated conversations
- better at helping with practical tasks
- easier to manage across multiple chat sessions
- more productive than a simple question-and-answer interface

The goal is to make the chatbot a daily-use assistant inside the product.

## 2. Current Module Baseline

Based on the current project structure, the module already appears to support:

- multi-turn text chat
- Gemini-based conversation flow
- user and model message handling
- general assistant interaction

This creates a good baseline, but the module still needs memory, organization, export, and task-focused improvements.

## 3. Product Vision

The final chatbot should allow a user to:

1. start multiple conversations
2. save and restore previous chats
3. use prompt templates for common tasks
4. export useful conversations
5. generate summaries and action items
6. switch between assistant modes when needed

## 4. Main User Use Cases

### General Productivity Use Cases
- ask questions
- rewrite text
- brainstorm ideas
- plan tasks
- summarize content

### Business Use Cases
- draft messages
- create proposals
- prepare structured answers
- extract key decisions

### Personal Use Cases
- quick explanations
- language help
- idea generation
- daily assistant-style interaction

## 5. Core Feature Groups

### 5.1 Conversation Management Layer

#### Goal
Make chat sessions persistent and easier to organize.

#### Planned Features
- save conversation history
- restore previous chats
- auto-generate chat titles
- rename chat manually
- pin important chats
- delete old chats
- sort recent chats

#### UX Notes
- users should feel that conversations are real workspaces, not disposable temporary messages

### 5.2 Message Interaction Layer

#### Goal
Give more control over how messages are used and refined.

#### Planned Features
- copy message
- regenerate response
- edit and resend user prompt
- retry with different style
- expand answer
- shorten answer
- convert answer to bullet points

#### UX Notes
- this layer is important for practical workflow improvement

### 5.3 Prompt Assistance Layer

#### Goal
Reduce effort for repeated or structured tasks.

#### Planned Features
- prompt templates
- quick task presets
- suggestion chips
- category-based assistant prompts
- custom reusable prompt presets

#### UX Notes
- templates should be outcome-based, not overly technical
- examples: email drafting, summarization, rewriting, brainstorming, translation

### 5.4 Output Utility Layer

#### Goal
Make chatbot output more reusable outside the module.

#### Planned Features
- export chat to TXT
- export chat to Markdown
- summarize full conversation
- generate action items from conversation
- copy full thread

#### UX Notes
- this turns chat from disposable conversation into reusable work output

### 5.5 Assistant Mode Layer

#### Goal
Allow users to switch chatbot behavior based on task type.

#### Planned Modes
- general assistant
- writing assistant
- planner assistant
- explainer assistant
- brainstorming assistant
- study assistant
- business assistant

#### UX Notes
- modes should adjust tone and structure, not overwhelm the user

### 5.6 File And Context Awareness Layer

#### Goal
Increase the chatbot's ability to work with real user material.

#### Planned Features
- file attachment support
- text paste with reference mode
- conversation context summary
- use last response as reference
- thread-aware follow-up suggestions

#### UX Notes
- this should be added after basic chat management is strong

## 6. Recommended Interface Structure

The future UI can be organized into:

### Section A: Chat Sidebar
- recent chats
- pinned chats
- new chat button

### Section B: Main Conversation Area
- message list
- typing area
- suggestion chips

### Section C: Utility Bar
- export
- summarize
- action items
- switch assistant mode

### Section D: Prompt Helper Area
- templates
- quick actions
- reusable prompts

## 7. Implementation Blueprint By Phase

### Phase 1: Chat Management Upgrade

#### Primary Goal
Make chat persistent and easier to use day to day.

#### Features
- saved chats
- chat restore
- copy and regenerate
- export basics
- auto-titled conversations

#### Expected Outcome
- users stop losing useful conversations
- the chatbot feels more mature and stable

### Phase 2: Productivity Upgrade

#### Primary Goal
Make the chatbot more useful for real work tasks.

#### Features
- prompt templates
- conversation summary
- action items
- quick rewriting actions
- pinned chats

#### Expected Outcome
- users can rely on the chatbot for recurring work
- productivity value increases clearly

### Phase 3: Assistant Upgrade

#### Primary Goal
Turn the chatbot into a flexible task-aware assistant.

#### Features
- assistant modes
- reusable custom prompts
- file-aware chat
- context-aware follow-up suggestions

#### Expected Outcome
- the chatbot becomes more personalized and more powerful inside the app

## 8. Functional Subsystems To Plan Later

These subsystems should later receive mini-plans:

### Chat History Subsystem
- storage model
- chat title strategy
- pin and delete rules

### Prompt Template Subsystem
- template categories
- user presets
- insertion behavior

### Export And Summary Subsystem
- export mapping
- conversation summary generation
- action item extraction

### Assistant Mode Subsystem
- system prompt mapping
- UI switching behavior
- mode persistence

### File Context Subsystem
- attachment flow
- content extraction
- prompt-context merge strategy

## 9. Risks And Design Considerations

### Technical Risks
- large chat histories may slow local rendering
- file-aware chat increases complexity significantly
- mode switching can become hard to manage if prompts are inconsistent

### UX Risks
- too many helper actions may clutter the interface
- weak chat organization reduces value even if features exist
- too many assistant modes may confuse users

### Mitigation Direction
- prioritize persistence and clean organization first
- keep first release of assistant modes small
- use progressive disclosure for advanced features

## 10. Priority Order Inside This Module

If development starts immediately, the best internal order is:

1. saved chat history
2. chat restore
3. copy and regenerate
4. export basics
5. prompt templates
6. summary and action items
7. assistant modes
8. file-aware chat

## 11. Success Criteria

The module can be considered meaningfully upgraded when:

- users can revisit and manage previous chats easily
- users can reuse chatbot outputs outside the app
- users can use templates for common tasks
- the chatbot feels like a practical assistant, not just a demo conversation box

## 12. Recommended Next Planning Direction

After this file, the next planning direction should be:

1. refine Tier 2 modules in more depth if needed
2. convert priority features into implementation task lists
