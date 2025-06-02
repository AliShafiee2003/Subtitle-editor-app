# **App Name**: Subtitle Weaver

## Core Features:

- File Upload & Parsing: Allow users to upload subtitle files (SRT, VTT, ASS, etc.), validate their integrity, and parse them into timestamped cue objects.
- Language Selection: Provide a “Target Language” selector populated with all major languages plus the ability to add a custom language (code + name).
- Automatic Translation: Generate a translation for each subtitle cue by calling a Large Language Model API with settings auto-tuned to the target language, and cache results to avoid repeated API calls.
- Interactive Subtitle Editor: Display original and translated text side-by-side in an editable format, allowing inline corrections, annotations, and notes per cue.
- Timeline & Synchronization: Offer a drag-and-drop timeline and numeric inputs for adjusting start/end times of each cue, with real-time video preview reflecting all edits.
- Styling & Formatting Controls: Let users adjust font family and size (px/em); set text color (hex/RGB), bold, italic, and text-shadow; choose vertical placement (Top/Middle/Bottom) with custom offset; and configure background color, opacity, border radius, and border.
- Project Persistence & Export: Auto-save all edits locally (IndexedDB) with manual “Save Project”/“Load Project” options; export corrected subtitle files in the original format or any other supported format.
- UI Internationalization & Themes: Fully internationalized interface (e.g. English, Farsi) with a Dark/Light mode toggle and user-defined style & translation presets.
- Performance & Cost Optimization: Cache translation results per cue and offer adjustable translation-quality profiles to balance speed, accuracy, and API cost.
- System Health & Notifications: Display toast notifications on translation/API failures or network loss, and log errors for later review.

## Style Guidelines:

- Primary Color: Soft lavender (`#E6E6FA`) – evokes calm and focus
- Background Color: Light gray (`#F5F5F5`) – clean, neutral backdrop
- Accent Color: Muted purple (`#B0B0C8`) – interactive elements & highlights
- Text Color: Dark charcoal (`#333333`) for high readability
- Muted Text: Mid gray (`#666666`) for secondary information
- Semantic Colors: Success: `#4CAF50`, Warning: `#FFC107`, Error: `#F44336`, Info: `#2196F3`
- Font Family: Clean, humanist sans-serif (e.g. Inter, Helvetica Neue, Arial)
- Font Sizes (px): Caption: 14, Body: 16, Subtitle:20, H4: 24, H3: 32, H2: 40, H1: 48
- Line-Height: 1.5× font size
- Font Weights: Normal: 400, Medium: 500, Bold: 700
- Baseline Grid: 8 px multiples (allow 4 px when necessary)
- Container Padding: 24 px horizontal
- Gutter (between columns): 16 px
- Border Radius: 4 px (consistent for buttons, inputs, cards)
- Style: Simple, minimalist line icons
- Stroke Width: 2 px
- Line Cap & Join: Round
- Size: 24 × 24 px default, scalable in 4 px steps
- Duration: 200 ms for most UI changes
- Timing Function: `ease-in-out`
- Properties: `all` or specific (e.g. `opacity`, `transform`)
- Reduced Motion: Honor `prefers-reduced-motion` by disabling non-essential animations