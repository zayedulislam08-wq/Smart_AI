# Video Analyzer Feature Plan

This file is a detailed planning blueprint for the `Video Analyzer` module. It defines how the module can evolve from a basic video summary tool into a timeline-aware video intelligence workspace.

## 1. Module Objective

The `Video Analyzer` should become a practical analysis tool for:

- long videos
- educational videos
- meeting recordings
- interview recordings
- content research
- social media clip analysis

The goal is to help users understand video content faster and extract structured value from it.

## 2. Current Module Baseline

Based on the current project structure, the module already appears to support:

- video analysis flow
- summary-oriented output
- key-point style interpretation
- subtitle-like or frame-based understanding support

This means the next upgrades should focus on timestamps, structured modes, export, and workflow intelligence.

## 3. Product Vision

The final `Video Analyzer` should allow a user to:

1. upload a video
2. choose an analysis mode
3. process the content with visible progress
4. receive timestamp-aware structured output
5. export summaries, subtitles, or chapters
6. revisit previous analyses

## 4. Main User Use Cases

### Education Use Cases
- summarize lecture recordings
- extract chapter breakdowns
- generate study notes
- locate important teaching moments

### Business Use Cases
- summarize meeting recordings
- extract action items
- identify key discussion moments
- prepare short recaps

### Creator Use Cases
- detect highlight moments
- find clip-worthy timestamps
- generate title and description ideas
- understand scene flow

## 5. Core Feature Groups

### 5.1 Video Input Layer

#### Goal
Make video intake more transparent and dependable.

#### Planned Features
- drag-and-drop upload
- file picker upload
- metadata preview
- duration display
- size display
- type validation
- input quality warnings for oversized files

#### UX Notes
- users should know what they uploaded before processing starts
- file errors should be easy to understand

### 5.2 Analysis Mode Layer

#### Goal
Turn the module into a multi-purpose analysis tool.

#### Planned Modes
- summary mode
- subtitle mode
- chapter mode
- scene breakdown mode
- key moment detection mode
- meeting recap mode
- interview analysis mode
- learning notes mode
- social media highlight mode

#### UX Notes
- users should start from an analysis goal
- each mode should have a short plain-language description

### 5.3 Timeline Intelligence Layer

#### Goal
Make outputs timestamp-aware and easier to navigate.

#### Planned Features
- timestamped summary
- timestamped key points
- chapter generation
- clickable timestamps
- scene segment display
- moment markers
- beginning, middle, and ending structure summary

#### UX Notes
- this is one of the most important upgrades
- timestamps make the module feel much more practical and premium

### 5.4 AI Insight Layer

#### Goal
Move beyond plain summary into structured intelligence.

#### Planned Features
- detect topic automatically
- identify important moments
- generate title suggestion
- generate short description
- extract action items for meeting-type videos
- generate learning notes
- detect likely highlights for short clips
- detect speaker changes where possible

#### UX Notes
- the module should feel like an analysis assistant, not just a summarizer

### 5.5 Output And Export Layer

#### Goal
Let users reuse the analysis outside the app.

#### Planned Features
- export summary to TXT
- export summary to Markdown
- export transcript to TXT
- export subtitles to SRT
- export chapter list
- copy structured result

#### UX Notes
- export formats should match real user workflows
- subtitle export is especially important for creator and educational use cases

### 5.6 History And Review Layer

#### Goal
Allow users to revisit previous analyses instead of losing work.

#### Planned Features
- recent analysis history
- last processed file restore
- saved result view
- repeat with different mode
- compare fast mode versus deep mode results later

#### UX Notes
- history increases long-term usability significantly

## 6. Recommended Interface Structure

The future UI can be organized into:

### Section A: Upload Panel
- file input
- drag-and-drop area
- metadata preview

### Section B: Analysis Controls
- analysis mode selector
- optional instruction input
- fast versus deep mode toggle

### Section C: Output Workspace
- summary panel
- timeline panel
- chapters or subtitles panel

### Section D: Action Bar
- analyze button
- retry button
- export controls
- clear session

### Section E: Insights Panel
- topic
- key moments
- action items
- title and description suggestions

## 7. Implementation Blueprint By Phase

### Phase 1: Structured Output Upgrade

#### Primary Goal
Make the module more useful immediately through clearer outputs.

#### Features
- metadata preview
- multiple analysis modes
- export basics
- visible upload validation
- cleaner summary presentation

#### Expected Outcome
- users understand what the module can do
- the outputs feel more organized and practical

### Phase 2: Timeline Upgrade

#### Primary Goal
Make outputs time-aware and easier to act on.

#### Features
- timestamped summaries
- chapter generation
- key moment detection
- clickable timeline sections
- subtitle export

#### Expected Outcome
- the module becomes much more valuable for real-world review workflows
- creators and educators gain more direct utility

### Phase 3: Intelligence Upgrade

#### Primary Goal
Turn the module into a deeper video intelligence assistant.

#### Features
- meeting recap mode
- action item extraction
- clip suggestion engine
- interview analysis mode
- saved analysis history

#### Expected Outcome
- the module becomes useful for business and creator use cases, not just general analysis

## 8. Functional Subsystems To Plan Later

These subsystems should later receive mini-plans:

### Video Intake Subsystem
- upload validation
- metadata extraction
- file-size rules

### Analysis Orchestration Subsystem
- mode-to-prompt mapping
- frame sampling strategy
- retry logic

### Timeline Rendering Subsystem
- timestamps
- chapter UI
- clickable navigation

### Export Subsystem
- subtitle formatting
- chapter export mapping
- structured copy behavior

### History Subsystem
- recent analysis storage
- restore logic
- result comparison flow

## 9. Risks And Design Considerations

### Technical Risks
- large videos can be expensive and slow to analyze
- frame sampling quality may affect output reliability
- transcript-like output may vary depending on source quality

### UX Risks
- users may expect perfect subtitle accuracy
- too many modes may create confusion
- long processing without feedback may reduce trust

### Mitigation Direction
- start with strong progress states
- clearly label each analysis mode
- distinguish summary mode from subtitle-grade output

## 10. Priority Order Inside This Module

If development starts immediately, the best internal order is:

1. upload metadata preview
2. analysis mode presets
3. export basics
4. timestamped summary
5. chapter generation
6. key moment detection
7. subtitle export
8. analysis history

## 11. Success Criteria

The module can be considered meaningfully upgraded when:

- users can choose the right analysis mode quickly
- outputs are structured and easy to reuse
- timestamp-aware navigation is available
- summaries and chapters are exportable
- the module supports creator, meeting, and education use cases better

## 12. Recommended Next Planning File

After this file, the next best planning file should be:

1. `AI_POWERED_CHATBOT_FEATURE_PLAN.md`
