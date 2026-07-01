export const toolCategories = [
  {
    id: "audio",
    title: "Audio Tools",
    icon: "fa-music",
    color: "from-sky-500 to-blue-600",
    description: "Convert, compress, and edit audio files in bulk client-side."
  },
  {
    id: "video",
    title: "Video Tools",
    icon: "fa-video",
    color: "from-purple-500 to-indigo-600",
    description: "Compress, resize, transcode, and extract frames client-side."
  },
  {
    id: "gif-image",
    title: "GIF & Image Tools",
    icon: "fa-image",
    color: "from-pink-500 to-rose-600",
    description: "Create and optimize GIFs, crop images, and build colors."
  },
  {
    id: "ai-generators",
    title: "AI Writing & World-Building",
    icon: "fa-robot",
    color: "from-emerald-500 to-teal-600",
    description: "AI storytellers, outline developers, and lore generators."
  },
  {
    id: "marketing",
    title: "Marketing & Calculators",
    icon: "fa-chart-line",
    color: "from-amber-500 to-orange-600",
    description: "Meta ad previews, ad ROI estimators, and creative template tools."
  },
  {
    id: "utilities",
    title: "General Utilities",
    icon: "fa-screwdriver-wrench",
    color: "from-gray-500 to-slate-600",
    description: "Word counters, JSON prettifiers, and secure text checkers."
  }
];

export const toolsList = [
  // AUDIO TOOLS
  {
    id: "bulk-audio-converter",
    categoryId: "audio",
    name: "Bulk Audio Converter",
    desc: "Convert multiple audio files to MP3, WAV, AAC, FLAC, OGG, or M4A format client-side.",
    icon: "fa-arrows-rotate",
    path: "/tools/bulk-audio-converter",
    faqs: [
      { q: "Where are my files uploaded?", a: "Your files never leave your computer. All conversion runs locally inside your browser via WebAssembly (FFmpeg.wasm)." },
      { q: "What audio formats are supported?", a: "Inputs can be almost any audio format (MP3, WAV, AAC, M4A, OGG, FLAC, etc.). Outputs can be saved as MP3, WAV, AAC, FLAC, OGG, or M4A." }
    ]
  },
  {
    id: "bulk-audio-compressor",
    categoryId: "audio",
    name: "Bulk Audio Compressor",
    desc: "Reduce file sizes of multiple audio files by optimizing bitrate and sample rate.",
    icon: "fa-compress",
    path: "/tools/bulk-audio-compressor",
    faqs: [
      { q: "Does compression reduce quality?", a: "Yes, adjusting the bitrate lowers file size but may decrease fine details. A bitrate of 128kbps or 192kbps provides a great balance of size and quality." }
    ]
  },
  {
    id: "bulk-video-to-audio",
    categoryId: "audio",
    name: "Video to Audio Converter",
    desc: "Extract clean audio soundtracks from MP4, WebM, or MOV video files in bulk.",
    icon: "fa-file-audio",
    path: "/tools/bulk-video-to-audio",
    faqs: [
      { q: "Can I extract audio from multiple videos?", a: "Yes. You can drag and drop multiple videos, and each audio track will be extracted in sequence." }
    ]
  },
  {
    id: "bulk-audio-speed",
    categoryId: "audio",
    name: "Bulk Audio Speed Changer",
    desc: "Speed up or slow down multiple audio files from 0.25x to 4x speed.",
    icon: "fa-gauge",
    path: "/tools/bulk-audio-speed",
    faqs: [
      { q: "Will the pitch change?", a: "No. The tempo is adjusted while keeping the original pitch intact." }
    ]
  },
  {
    id: "bulk-audio-volume",
    categoryId: "audio",
    name: "Bulk Audio Volume Changer",
    desc: "Boost, reduce, or normalize the audio levels of multiple audio files.",
    icon: "fa-volume-high",
    path: "/tools/bulk-audio-volume",
    faqs: [
      { q: "How much can I boost the volume?", a: "You can increase volume up to 300% (3x). Note that boosting too much might cause digital clipping/distortion." }
    ]
  },
  {
    id: "vocal-remover",
    categoryId: "audio",
    name: "Vocal Remover / Splitter",
    desc: "Extract separate vocals and instrumental tracks from audio files.",
    icon: "fa-microphone-slash",
    path: "/tools/vocal-remover"
  },
  {
    id: "pitch-shifter",
    categoryId: "audio",
    name: "Pitch Shifter",
    desc: "Change the key/pitch of audio files without altering their speeds.",
    icon: "fa-sliders",
    path: "/tools/pitch-shifter"
  },
  {
    id: "audio-equalizer",
    categoryId: "audio",
    name: "Audio Equalizer",
    desc: "Apply bass boost, vocal highlights, or custom EQ filters to your files.",
    icon: "fa-sliders-h",
    path: "/tools/audio-equalizer"
  },
  {
    id: "voice-recorder",
    categoryId: "audio",
    name: "Voice Recorder",
    desc: "Record high-quality sound directly from your microphone and download the file.",
    icon: "fa-microphone",
    path: "/tools/voice-recorder"
  },
  {
    id: "text-to-speech",
    categoryId: "audio",
    name: "Text-to-Speech (TTS)",
    desc: "Convert text transcripts into natural sounding speech audio files.",
    icon: "fa-volume-low",
    path: "/tools/text-to-speech"
  },

  // VIDEO TOOLS
  {
    id: "video-frame-extractor",
    categoryId: "video",
    name: "Video Frame Extractor",
    desc: "Extract high-quality frames as PNG/JPG images at custom intervals.",
    icon: "fa-film",
    path: "/tools/video-frame-extractor",
    faqs: [
      { q: "How fast is frame extraction?", a: "It runs completely in your browser. Large video files might take some seconds to load and parse, but it operates entirely offline." }
    ]
  },
  {
    id: "first-last-frame-extractor",
    categoryId: "video",
    name: "First & Last Frame Extractor",
    desc: "Grab key thumbnail screenshots (first and last frames) from multiple videos.",
    icon: "fa-images",
    path: "/tools/first-last-frame-extractor"
  },
  {
    id: "bulk-video-converter",
    categoryId: "video",
    name: "Bulk Video Converter",
    desc: "Transcode multiple video files into MP4, WebM, OGV, or AVI formats.",
    icon: "fa-video-slash",
    path: "/tools/bulk-video-converter"
  },
  {
    id: "bulk-video-compressor",
    categoryId: "video",
    name: "Bulk Video Compressor",
    desc: "Shrink video file sizes by adjusting quality presets and resolution.",
    icon: "fa-compress-arrows-alt",
    path: "/tools/bulk-video-compressor",
    faqs: [
      { q: "Is the video data private?", a: "Absolutely. All processing occurs locally, so your private videos are never sent to external servers." }
    ]
  },
  {
    id: "video-trimmer",
    categoryId: "video",
    name: "Video Cutter & Trimmer",
    desc: "Trim or extract specific duration clips from your video files.",
    icon: "fa-scissors",
    path: "/tools/video-trimmer"
  },
  {
    id: "video-cropper",
    categoryId: "video",
    name: "Video Cropper",
    desc: "Crop aspect ratios (like 16:9 to 9:16 vertical grid) for social clips.",
    icon: "fa-crop",
    path: "/tools/video-cropper"
  },
  {
    id: "video-resizer",
    categoryId: "video",
    name: "Video Resizer & Scaler",
    desc: "Scale the width and height of video tracks.",
    icon: "fa-expand-arrows-alt",
    path: "/tools/video-resizer"
  },
  {
    id: "video-muter",
    categoryId: "video",
    name: "Video Muter",
    desc: "Strip and silence audio tracks from video files in bulk.",
    icon: "fa-volume-xmark",
    path: "/tools/video-muter"
  },

  // GIF & IMAGE TOOLS
  {
    id: "video-to-gif",
    categoryId: "gif-image",
    name: "Video to GIF Converter",
    desc: "Convert MP4 videos into high quality animated GIFs.",
    icon: "fa-exchange-alt",
    path: "/tools/video-to-gif"
  },
  {
    id: "gif-to-video",
    categoryId: "gif-image",
    name: "GIF to Video Converter",
    desc: "Convert looping animated GIFs into MP4/WebM videos.",
    icon: "fa-film",
    path: "/tools/gif-to-video"
  },
  {
    id: "gif-compressor",
    categoryId: "gif-image",
    name: "GIF Compressor",
    desc: "Reduce file sizes of animated GIFs by adjusting colors and frame rates.",
    icon: "fa-file-zipper",
    path: "/tools/gif-compressor"
  },
  {
    id: "gif-maker",
    categoryId: "gif-image",
    name: "GIF Maker",
    desc: "Assemble animated GIFs from static PNG or JPG image sequences.",
    icon: "fa-square-plus",
    path: "/tools/gif-maker"
  },
  {
    id: "gif-editor",
    categoryId: "gif-image",
    name: "GIF Editor",
    desc: "Resize, crop, reverse, or add textual filters to animated GIFs.",
    icon: "fa-pen-to-square",
    path: "/tools/gif-editor"
  },
  {
    id: "image-splitter",
    categoryId: "gif-image",
    name: "Image Splitter",
    desc: "Slice a single image into grids of equal blocks for social uploads.",
    icon: "fa-border-all",
    path: "/tools/image-splitter"
  },
  {
    id: "color-picker",
    categoryId: "gif-image",
    name: "Color Picker & Palette",
    desc: "Upload images and extract hex code colors or palettes.",
    icon: "fa-eye-dropper",
    path: "/tools/color-picker"
  },
  {
    id: "image-hue-adjuster",
    categoryId: "gif-image",
    name: "Image Color Adjuster",
    desc: "Quickly modify contrast, saturation, and hue balance.",
    icon: "fa-palette",
    path: "/tools/image-hue-adjuster"
  },

  // AI TOOLS
  {
    id: "story-plot-generator",
    categoryId: "ai-generators",
    name: "Story Plot Generator",
    desc: "Generate full story outlines, character roles, conflicts, and three-act layouts.",
    icon: "fa-book-open",
    path: "/tools/story-plot-generator",
    isAi: true
  },
  {
    id: "ai-story-generator",
    categoryId: "ai-generators",
    name: "AI Story Generator",
    desc: "Generate complete, immersive stories based on simple creative prompts.",
    icon: "fa-scroll",
    path: "/tools/ai-story-generator",
    isAi: true
  },
  {
    id: "story-outline-generator",
    categoryId: "ai-generators",
    name: "Story Outline Generator",
    desc: "Develop chapter-by-chapter story arcs and outlines.",
    icon: "fa-list-ol",
    path: "/tools/story-outline-generator",
    isAi: true
  },
  {
    id: "story-rewriter",
    categoryId: "ai-generators",
    name: "Story Rewriter",
    desc: "Rewrite stories to improve style, structure, pace, or narrative flow.",
    icon: "fa-pen-clip",
    path: "/tools/story-rewriter",
    isAi: true
  },
  {
    id: "story-summarizer",
    categoryId: "ai-generators",
    name: "Story Summarizer",
    desc: "Extract plots, characters, and themes from story snippets.",
    icon: "fa-compress",
    path: "/tools/story-summarizer",
    isAi: true
  },
  {
    id: "continue-writing",
    categoryId: "ai-generators",
    name: "Continue Writing",
    desc: "Continue writing your story text while maintaining stylistic flow.",
    icon: "fa-pen-nib",
    path: "/tools/continue-writing",
    isAi: true
  },
  {
    id: "chapter-generator",
    categoryId: "ai-generators",
    name: "Chapter Generator",
    desc: "Generate full chapter segments from scene outlines.",
    icon: "fa-file-lines",
    path: "/tools/chapter-generator",
    isAi: true
  },
  {
    id: "book-title-generator",
    categoryId: "ai-generators",
    name: "Book Title Generator",
    desc: "Generate creative, market-ready title ideas for your novel.",
    icon: "fa-tags",
    path: "/tools/book-title-generator",
    isAi: true
  },
  {
    id: "poem-generator",
    categoryId: "ai-generators",
    name: "Poem Generator",
    desc: "Compose beautiful poetry based on customized meters and prompts.",
    icon: "fa-feather",
    path: "/tools/poem-generator",
    isAi: true
  },
  {
    id: "lyrics-generator",
    categoryId: "ai-generators",
    name: "Lyrics Generator",
    desc: "Generate song lyrics for multiple genres and emotional vibes.",
    icon: "fa-music",
    path: "/tools/lyrics-generator",
    isAi: true
  },
  {
    id: "tv-show-generator",
    categoryId: "ai-generators",
    name: "TV Show Generator",
    desc: "Generate TV pilot concepts, characters, and episode pitches.",
    icon: "fa-tv",
    path: "/tools/tv-show-generator",
    isAi: true
  },
  {
    id: "dialogue-generator",
    categoryId: "ai-generators",
    name: "Dialogue Generator",
    desc: "Create engaging scripts or dialogues between unique characters.",
    icon: "fa-comments",
    path: "/tools/dialogue-generator",
    isAi: true
  },
  {
    id: "dialogue-enhancer",
    categoryId: "ai-generators",
    name: "Dialogue Enhancer",
    desc: "Inject energy and authentic speech styles into your drafts.",
    icon: "fa-comment-medical",
    path: "/tools/dialogue-enhancer",
    isAi: true
  },
  {
    id: "world-building-generator",
    categoryId: "ai-generators",
    name: "World-building Generator",
    desc: "Develop rich histories, magic configurations, and technological lore.",
    icon: "fa-globe",
    path: "/tools/world-building-generator",
    isAi: true
  },
  {
    id: "planet-generator",
    categoryId: "ai-generators",
    name: "Planet Generator",
    desc: "Generate planetary structures, atmosphere composition, and terrain details.",
    icon: "fa-earth-americas",
    path: "/tools/planet-generator",
    isAi: true
  },
  {
    id: "country-maker",
    categoryId: "ai-generators",
    name: "Country & Kingdom Maker",
    desc: "Build fantasy countries with cities, political maps, and royal assets.",
    icon: "fa-fort-awesome",
    path: "/tools/country-maker",
    isAi: true
  },
  {
    id: "faction-generator",
    categoryId: "ai-generators",
    name: "Faction / Fictional Religion Maker",
    desc: "Generate lore for sects, guilds, and religions.",
    icon: "fa-users-gear",
    path: "/tools/faction-generator",
    isAi: true
  },
  {
    id: "fantasy-currency-generator",
    categoryId: "ai-generators",
    name: "Fantasy Currency Creator",
    desc: "Generate coins, bills, trading rules, and financial historical lore.",
    icon: "fa-coins",
    path: "/tools/fantasy-currency-generator",
    isAi: true
  },
  {
    id: "artifact-generator",
    categoryId: "ai-generators",
    name: "Artifact Generator",
    desc: "Create details for legendary weapons, items, and accessories.",
    icon: "fa-gem",
    path: "/tools/artifact-generator",
    isAi: true
  },
  {
    id: "spell-generator",
    categoryId: "ai-generators",
    name: "Spell Generator",
    desc: "Formulate fantasy spell attributes, elemental types, and limits.",
    icon: "fa-wand-magic-sparkles",
    path: "/tools/spell-generator",
    isAi: true
  },
  {
    id: "quest-generator",
    categoryId: "ai-generators",
    name: "Quest & Prophecy Generator",
    desc: "Design detailed questlines or obscure prophetic riddles.",
    icon: "fa-compass-drafting",
    path: "/tools/quest-generator",
    isAi: true
  },
  {
    id: "boss-generator",
    categoryId: "ai-generators",
    name: "Boss Antagonist Generator",
    desc: "Generate detailed stats, background, and motives for video game villains.",
    icon: "fa-dragon",
    path: "/tools/boss-generator",
    isAi: true
  },
  {
    id: "superpower-generator",
    categoryId: "ai-generators",
    name: "Superpower Generator",
    desc: "Brainstorm superpowers with balanced drawbacks and origins.",
    icon: "fa-bolt",
    path: "/tools/superpower-generator",
    isAi: true
  },
  {
    id: "romantic-scenario",
    categoryId: "ai-generators",
    name: "Romantic Scenario Generator",
    desc: "Generate heartfelt prompts and dramatic outlines.",
    icon: "fa-heart",
    path: "/tools/romantic-scenario",
    isAi: true
  },
  {
    id: "character-outfit",
    categoryId: "ai-generators",
    name: "Character Outfit Generator",
    desc: "Generate styling, clothing assets, and material descriptions.",
    icon: "fa-shirt",
    path: "/tools/character-outfit",
    isAi: true
  },
  {
    id: "ai-character",
    categoryId: "ai-generators",
    name: "AI Character Generator",
    desc: "Assemble deep, multi-dimensional story characters.",
    icon: "fa-user-ninja",
    path: "/tools/ai-character",
    isAi: true
  },

  // MARKETING TOOLS
  {
    id: "yt-video-ideas",
    categoryId: "marketing",
    name: "YouTube Video Idea Generator",
    desc: "Brainstorm engaging, high-CTR YouTube video concepts.",
    icon: "fa-lightbulb",
    path: "/tools/yt-video-ideas",
    isAi: true
  },
  {
    id: "yt-description-gen",
    categoryId: "marketing",
    name: "YouTube Description Generator",
    desc: "Generate SEO-optimized description text.",
    icon: "fa-align-left",
    path: "/tools/yt-description-gen",
    isAi: true
  },
  {
    id: "yt-channel-name",
    categoryId: "marketing",
    name: "YouTube Channel Name Generator",
    desc: "Brainstorm catchy, brandable channel names.",
    icon: "fa-signature",
    path: "/tools/yt-channel-name",
    isAi: true
  },
  {
    id: "newsletter-generator",
    categoryId: "marketing",
    name: "Newsletter Generator",
    desc: "Draft professional, engaging newsletters.",
    icon: "fa-envelope-open-text",
    path: "/tools/newsletter-generator",
    isAi: true
  },
  {
    id: "meta-ad-preview",
    categoryId: "marketing",
    name: "Meta Ad Preview Tool",
    desc: "Preview how Facebook/Instagram ads render across feeds.",
    icon: "fa-rectangle-ad",
    path: "/tools/meta-ad-preview"
  },
  {
    id: "ai-naming-ads",
    categoryId: "marketing",
    name: "AI Naming Generator for Ads",
    desc: "Construct structured, consistent campaign and ad-set name drafts.",
    icon: "fa-spell-check",
    path: "/tools/ai-naming-ads"
  },
  {
    id: "creative-calculator",
    categoryId: "marketing",
    name: "Creative Capacity Calculator",
    desc: "Estimate team designer capacity and creative outputs.",
    icon: "fa-calculator",
    path: "/tools/creative-calculator"
  },
  {
    id: "fb-emojis-hub",
    categoryId: "marketing",
    name: "Facebook Emojis Copy Hub",
    desc: "Grid picker of high-converting emoticons for copywriters.",
    icon: "fa-face-smile-wink",
    path: "/tools/fb-emojis-hub"
  },
  {
    id: "fb-ad-cost",
    categoryId: "marketing",
    name: "Facebook Ad Cost Calculator",
    desc: "Calculate CPA, ROI, CPC, and CPM benchmarks in seconds.",
    icon: "fa-percent",
    path: "/tools/fb-ad-cost"
  },
  {
    id: "chatgpt-ad-prompts",
    categoryId: "marketing",
    name: "ChatGPT Ad Template Prompts",
    desc: "Copy-pasteable generative templates for ad copy.",
    icon: "fa-copy",
    path: "/tools/chatgpt-ad-prompts"
  },

  // UTILITIES
  {
    id: "word-counter",
    categoryId: "utilities",
    name: "Word & Character Counter",
    desc: "Count text length, sentences, read duration, and word counts.",
    icon: "fa-hashtag",
    path: "/tools/word-counter"
  },
  {
    id: "emoji-picker",
    categoryId: "utilities",
    name: "Emoji Picker & Copier",
    desc: "Search and copy emojis easily inside your browser.",
    icon: "fa-icons",
    path: "/tools/emoji-picker"
  },
  {
    id: "json-sql-formatter",
    categoryId: "utilities",
    name: "JSON/SQL Formatter",
    desc: "Format and pretty-print JSON and SQL syntax strings.",
    icon: "fa-code",
    path: "/tools/json-sql-formatter"
  },
  {
    id: "password-generator",
    categoryId: "utilities",
    name: "Secure Password Generator",
    desc: "Create high-entropy random password strings locally.",
    icon: "fa-key",
    path: "/tools/password-generator"
  },
  {
    id: "text-similarity",
    categoryId: "utilities",
    name: "Text Similarity Checker",
    desc: "Compare percentage word overlaps between two passages.",
    icon: "fa-scale-balanced",
    path: "/tools/text-similarity"
  },
  {
    id: "faq-generator",
    categoryId: "utilities",
    name: "FAQ Generator",
    desc: "Analyze copy text to generate custom Q&A sections.",
    icon: "fa-question",
    path: "/tools/faq-generator"
  },
  {
    id: "text-rephrase",
    categoryId: "utilities",
    name: "Text Rephrase & Clarifier",
    desc: "Adjust flow or structure of input sentences.",
    icon: "fa-arrows-rotate",
    path: "/tools/text-rephrase"
  }
];
