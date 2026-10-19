// The single list of every tool. The router, sitemap, search, home page and directory all read from here.
// `name` is short and easy to search for. `desc` says, in plain words, what the tool does for you.
// Paths never change: they are the public URLs.

export const toolCategories = [
  {
    id: "audio",
    title: "Audio tools",
    icon: "fa-music",
    description: "Convert, shrink, speed up, clean up and record sound.",
  },
  {
    id: "video",
    title: "Video tools",
    icon: "fa-video",
    description: "Trim, shrink, resize and convert videos.",
  },
  {
    id: "gif-image",
    title: "GIF & image tools",
    icon: "fa-image",
    description: "Make and shrink GIFs, split pictures and pick colors.",
  },
  {
    id: "ai-generators",
    title: "AI writing tools",
    icon: "fa-robot",
    description: "Stories, poems, characters and whole fantasy worlds, written with AI.",
  },
  {
    id: "marketing",
    title: "Marketing tools",
    icon: "fa-chart-line",
    description: "YouTube ideas, ad previews and ad cost calculators.",
  },
  {
    id: "utilities",
    title: "Everyday tools",
    icon: "fa-screwdriver-wrench",
    description: "Count words, make passwords, tidy code and more.",
  },
];

export const toolsList = [
  // AUDIO
  { id: "bulk-audio-converter", categoryId: "audio", name: "Bulk Audio Converter", desc: "Change audio files to MP3, WAV, M4A, FLAC and more, many at once.", icon: "fa-arrows-rotate", path: "/tools/bulk-audio-converter" },
  { id: "bulk-audio-compressor", categoryId: "audio", name: "Audio Compressor", desc: "Make audio files smaller so they're easier to send and store.", icon: "fa-compress", path: "/tools/bulk-audio-compressor" },
  { id: "bulk-video-to-audio", categoryId: "audio", name: "Video to Audio", desc: "Get the sound out of videos as MP3, WAV and more.", icon: "fa-file-audio", path: "/tools/bulk-video-to-audio" },
  { id: "bulk-audio-speed", categoryId: "audio", name: "Audio Speed Changer", desc: "Make audio play faster or slower.", icon: "fa-gauge", path: "/tools/bulk-audio-speed" },
  { id: "bulk-audio-volume", categoryId: "audio", name: "Volume Changer", desc: "Make audio louder or quieter, many files at once.", icon: "fa-volume-high", path: "/tools/bulk-audio-volume" },
  { id: "vocal-remover", categoryId: "audio", name: "Vocal Remover", desc: "Take the singing out of a song, or keep only the voice.", icon: "fa-microphone-slash", path: "/tools/vocal-remover" },
  { id: "pitch-shifter", categoryId: "audio", name: "Pitch Shifter", desc: "Make audio sound higher or lower.", icon: "fa-sliders", path: "/tools/pitch-shifter" },
  { id: "audio-equalizer", categoryId: "audio", name: "Audio Equalizer", desc: "Boost the bass, make voices clearer and more, with one click.", icon: "fa-sliders-h", path: "/tools/audio-equalizer" },
  { id: "voice-recorder", categoryId: "audio", name: "Voice Recorder", desc: "Record your voice with your microphone and save it as a file.", icon: "fa-microphone", path: "/tools/voice-recorder" },
  { id: "text-to-speech", categoryId: "audio", name: "Text to Speech", desc: "Type some text and hear it read out loud.", icon: "fa-volume-low", path: "/tools/text-to-speech" },

  // VIDEO
  { id: "video-frame-extractor", categoryId: "video", name: "Video Frame Extractor", desc: "Save still pictures from a video every few seconds.", icon: "fa-film", path: "/tools/video-frame-extractor" },
  { id: "first-last-frame-extractor", categoryId: "video", name: "First & Last Frame", desc: "Save the first and last picture of each video, for thumbnails.", icon: "fa-images", path: "/tools/first-last-frame-extractor" },
  { id: "bulk-video-converter", categoryId: "video", name: "Bulk Video Converter", desc: "Change videos to MP4, WebM and other formats, many at once.", icon: "fa-video-slash", path: "/tools/bulk-video-converter" },
  { id: "bulk-video-compressor", categoryId: "video", name: "Video Compressor", desc: "Make videos smaller so they're easier to share.", icon: "fa-compress-arrows-alt", path: "/tools/bulk-video-compressor" },
  { id: "video-trimmer", categoryId: "video", name: "Video Trimmer", desc: "Cut a video down to just the part you want.", icon: "fa-scissors", path: "/tools/video-trimmer" },
  { id: "video-cropper", categoryId: "video", name: "Video Cropper", desc: "Cut the edges off a video, for example to make it vertical for phones.", icon: "fa-crop", path: "/tools/video-cropper" },
  { id: "video-resizer", categoryId: "video", name: "Video Resizer", desc: "Change a video's size, like 1080p or 720p.", icon: "fa-expand-arrows-alt", path: "/tools/video-resizer" },
  { id: "video-muter", categoryId: "video", name: "Video Muter", desc: "Remove the sound from videos.", icon: "fa-volume-xmark", path: "/tools/video-muter" },
  { id: "watermark-remover", categoryId: "video", name: "Watermark Remover", desc: "Hide a logo or watermark in a video by blurring or filling the spot.", icon: "fa-eraser", path: "/tools/watermark-remover" },

  // GIF & IMAGE
  { id: "video-to-gif", categoryId: "gif-image", name: "Video to GIF", desc: "Turn a video clip into an animated GIF.", icon: "fa-exchange-alt", path: "/tools/video-to-gif" },
  { id: "gif-to-video", categoryId: "gif-image", name: "GIF to Video", desc: "Turn an animated GIF into an MP4 video.", icon: "fa-film", path: "/tools/gif-to-video" },
  { id: "gif-compressor", categoryId: "gif-image", name: "GIF Compressor", desc: "Make GIFs smaller so they load faster.", icon: "fa-file-zipper", path: "/tools/gif-compressor" },
  { id: "gif-maker", categoryId: "gif-image", name: "GIF Maker", desc: "Turn a set of pictures into an animated GIF.", icon: "fa-square-plus", path: "/tools/gif-maker" },
  { id: "gif-editor", categoryId: "gif-image", name: "GIF Editor", desc: "Resize, crop, speed up or reverse a GIF.", icon: "fa-pen-to-square", path: "/tools/gif-editor" },
  { id: "image-splitter", categoryId: "gif-image", name: "Image Splitter", desc: "Cut one picture into a grid of equal pieces, great for Instagram.", icon: "fa-border-all", path: "/tools/image-splitter" },
  { id: "color-picker", categoryId: "gif-image", name: "Color Picker", desc: "Find the exact colors in a picture and copy their codes.", icon: "fa-eye-dropper", path: "/tools/color-picker" },
  { id: "image-hue-adjuster", categoryId: "gif-image", name: "Image Color Adjuster", desc: "Change the brightness, contrast and colors of a picture.", icon: "fa-palette", path: "/tools/image-hue-adjuster" },

  // AI WRITING
  { id: "story-plot-generator", categoryId: "ai-generators", name: "Story Plot Generator", desc: "Get a full story plot: the characters, their problem and how it ends.", icon: "fa-book-open", path: "/tools/story-plot-generator", isAi: true },
  { id: "ai-story-generator", categoryId: "ai-generators", name: "AI Story Generator", desc: "Turn a short idea into a complete story.", icon: "fa-scroll", path: "/tools/ai-story-generator", isAi: true },
  { id: "story-outline-generator", categoryId: "ai-generators", name: "Story Outline Generator", desc: "Plan your story chapter by chapter.", icon: "fa-list-ol", path: "/tools/story-outline-generator", isAi: true },
  { id: "story-rewriter", categoryId: "ai-generators", name: "Story Rewriter", desc: "Rewrite your story so it reads better.", icon: "fa-pen-clip", path: "/tools/story-rewriter", isAi: true },
  { id: "story-summarizer", categoryId: "ai-generators", name: "Story Summarizer", desc: "Get a short summary of a long story.", icon: "fa-compress", path: "/tools/story-summarizer", isAi: true },
  { id: "continue-writing", categoryId: "ai-generators", name: "Continue Writing", desc: "Paste the start of a story and get what happens next.", icon: "fa-pen-nib", path: "/tools/continue-writing", isAi: true },
  { id: "chapter-generator", categoryId: "ai-generators", name: "Chapter Generator", desc: "Turn a short scene plan into a full chapter.", icon: "fa-file-lines", path: "/tools/chapter-generator", isAi: true },
  { id: "book-title-generator", categoryId: "ai-generators", name: "Book Title Generator", desc: "Get title ideas for your book.", icon: "fa-tags", path: "/tools/book-title-generator", isAi: true },
  { id: "poem-generator", categoryId: "ai-generators", name: "Poem Generator", desc: "Write a poem about anything.", icon: "fa-feather", path: "/tools/poem-generator", isAi: true },
  { id: "lyrics-generator", categoryId: "ai-generators", name: "Lyrics Generator", desc: "Write song lyrics in any style or mood.", icon: "fa-music", path: "/tools/lyrics-generator", isAi: true },
  { id: "tv-show-generator", categoryId: "ai-generators", name: "TV Show Generator", desc: "Come up with a TV show: the story, the characters and the episodes.", icon: "fa-tv", path: "/tools/tv-show-generator", isAi: true },
  { id: "dialogue-generator", categoryId: "ai-generators", name: "Dialogue Generator", desc: "Write a conversation between your characters.", icon: "fa-comments", path: "/tools/dialogue-generator", isAi: true },
  { id: "dialogue-enhancer", categoryId: "ai-generators", name: "Dialogue Enhancer", desc: "Make the conversations in your story sound more natural.", icon: "fa-comment-medical", path: "/tools/dialogue-enhancer", isAi: true },
  { id: "world-building-generator", categoryId: "ai-generators", name: "World Building Generator", desc: "Create a whole fantasy world: its history, places and rules.", icon: "fa-globe", path: "/tools/world-building-generator", isAi: true },
  { id: "planet-generator", categoryId: "ai-generators", name: "Planet Generator", desc: "Invent a planet: its land, air, weather and life.", icon: "fa-earth-americas", path: "/tools/planet-generator", isAi: true },
  { id: "country-maker", categoryId: "ai-generators", name: "Country & Kingdom Maker", desc: "Invent a country or kingdom with cities, rulers and history.", icon: "fa-fort-awesome", path: "/tools/country-maker", isAi: true },
  { id: "faction-generator", categoryId: "ai-generators", name: "Faction & Religion Maker", desc: "Invent groups, guilds or religions for your story.", icon: "fa-users-gear", path: "/tools/faction-generator", isAi: true },
  { id: "fantasy-currency-generator", categoryId: "ai-generators", name: "Fantasy Money Maker", desc: "Invent money for a fantasy world: coins, notes and their history.", icon: "fa-coins", path: "/tools/fantasy-currency-generator", isAi: true },
  { id: "artifact-generator", categoryId: "ai-generators", name: "Magic Item Generator", desc: "Invent legendary weapons and magic items.", icon: "fa-gem", path: "/tools/artifact-generator", isAi: true },
  { id: "spell-generator", categoryId: "ai-generators", name: "Spell Generator", desc: "Invent magic spells: what they do and what they cost.", icon: "fa-wand-magic-sparkles", path: "/tools/spell-generator", isAi: true },
  { id: "quest-generator", categoryId: "ai-generators", name: "Quest & Prophecy Generator", desc: "Write quests for games, or mysterious prophecies.", icon: "fa-compass-drafting", path: "/tools/quest-generator", isAi: true },
  { id: "boss-generator", categoryId: "ai-generators", name: "Boss & Villain Generator", desc: "Create a game boss or villain with a backstory and powers.", icon: "fa-dragon", path: "/tools/boss-generator", isAi: true },
  { id: "superpower-generator", categoryId: "ai-generators", name: "Superpower Generator", desc: "Invent a superpower, with a weakness to keep it fair.", icon: "fa-bolt", path: "/tools/superpower-generator", isAi: true },
  { id: "romantic-scenario", categoryId: "ai-generators", name: "Romance Scene Generator", desc: "Get ideas for romantic scenes and love stories.", icon: "fa-heart", path: "/tools/romantic-scenario", isAi: true },
  { id: "character-outfit", categoryId: "ai-generators", name: "Character Outfit Generator", desc: "Describe what your character wears, in detail.", icon: "fa-shirt", path: "/tools/character-outfit", isAi: true },
  { id: "ai-character", categoryId: "ai-generators", name: "Character Generator", desc: "Create a story character with a personality, a past and goals.", icon: "fa-user-ninja", path: "/tools/ai-character", isAi: true },

  // MARKETING
  { id: "yt-video-ideas", categoryId: "marketing", name: "YouTube Video Ideas", desc: "Get video ideas people will want to click.", icon: "fa-lightbulb", path: "/tools/yt-video-ideas", isAi: true },
  { id: "yt-description-gen", categoryId: "marketing", name: "YouTube Description Writer", desc: "Write a YouTube description that helps people find your video.", icon: "fa-align-left", path: "/tools/yt-description-gen", isAi: true },
  { id: "yt-channel-name", categoryId: "marketing", name: "YouTube Channel Names", desc: "Get catchy name ideas for your channel.", icon: "fa-signature", path: "/tools/yt-channel-name", isAi: true },
  { id: "newsletter-generator", categoryId: "marketing", name: "Newsletter Writer", desc: "Write an email newsletter in minutes.", icon: "fa-envelope-open-text", path: "/tools/newsletter-generator", isAi: true },
  { id: "meta-ad-preview", categoryId: "marketing", name: "Facebook & Instagram Ad Preview", desc: "See how your ad will look on Facebook and Instagram before you post it.", icon: "fa-rectangle-ad", path: "/tools/meta-ad-preview" },
  { id: "ai-naming-ads", categoryId: "marketing", name: "Ad Name Builder", desc: "Build neat, matching names for your ad campaigns.", icon: "fa-spell-check", path: "/tools/ai-naming-ads" },
  { id: "creative-calculator", categoryId: "marketing", name: "Design Team Calculator", desc: "Work out how many ads your design team can make, and what each one costs.", icon: "fa-calculator", path: "/tools/creative-calculator" },
  { id: "fb-emojis-hub", categoryId: "marketing", name: "Facebook Emoji Picker", desc: "Copy emojis that work well in Facebook posts and ads.", icon: "fa-face-smile-wink", path: "/tools/fb-emojis-hub" },
  { id: "fb-ad-cost", categoryId: "marketing", name: "Ad Cost Calculator", desc: "Work out what your ads really cost: per click, per sale, and your profit.", icon: "fa-percent", path: "/tools/fb-ad-cost" },
  { id: "chatgpt-ad-prompts", categoryId: "marketing", name: "ChatGPT Ad Prompts", desc: "Ready-made prompts that get ChatGPT to write your ads.", icon: "fa-copy", path: "/tools/chatgpt-ad-prompts" },

  // EVERYDAY
  { id: "word-counter", categoryId: "utilities", name: "Word & Character Counter", desc: "Count words and letters, and see how long your text takes to read.", icon: "fa-hashtag", path: "/tools/word-counter" },
  { id: "emoji-picker", categoryId: "utilities", name: "Emoji Picker", desc: "Search for any emoji and copy it.", icon: "fa-icons", path: "/tools/emoji-picker" },
  { id: "json-sql-formatter", categoryId: "utilities", name: "JSON & SQL Formatter", desc: "Make messy JSON or SQL code neat and easy to read.", icon: "fa-code", path: "/tools/json-sql-formatter" },
  { id: "password-generator", categoryId: "utilities", name: "Password Generator", desc: "Make a strong, random password.", icon: "fa-key", path: "/tools/password-generator" },
  { id: "text-similarity", categoryId: "utilities", name: "Text Similarity Checker", desc: "See how similar two pieces of text are.", icon: "fa-scale-balanced", path: "/tools/text-similarity" },
  { id: "faq-generator", categoryId: "utilities", name: "FAQ Generator", desc: "Get questions and answers for your product or page.", icon: "fa-question", path: "/tools/faq-generator" },
  { id: "text-rephrase", categoryId: "utilities", name: "Text Rephraser", desc: "Say the same thing in different words.", icon: "fa-arrows-rotate", path: "/tools/text-rephrase" },
  { id: "uuid-generator", categoryId: "utilities", name: "UUID Generator", desc: "Make random unique IDs (UUIDs) for your code.", icon: "fa-fingerprint", path: "/tools/uuid-generator" },
];
