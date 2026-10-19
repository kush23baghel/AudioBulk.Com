// Right-sidebar help: short plain-English tips and "what to do next" for each page.
// `next` lists tool ids that make sense after this tool. Tools without their own entry
// fall back to their category's tips and the other tools in that category.

export const pageGuides = {
  home: {
    tipsTitle: 'Start here',
    tips: [
      'Press Ctrl + K anywhere to search for a tool by what you want to do.',
      'Every tool works on your own computer, so nothing is uploaded.',
      'Most tools take many files at once and give you a single .zip back.',
      'Tap the star on a tool to keep it in your favorites.',
    ],
    next: ['bulk-audio-converter', 'video-trimmer', 'video-to-gif', 'ai-story-generator'],
    nextTitle: 'Popular first steps',
  },
  'all-tools': {
    tipsTitle: 'Finding a tool',
    tips: [
      'Type a word like "gif" or "louder" to filter the list.',
      'Tools marked AI need a free AI key. Add it once with the gear button.',
      'Pick a type at the top to see only those tools.',
    ],
  },
};

export const categoryTips = {
  audio: [
    'MP3 plays everywhere. Pick it if you are not sure.',
    'Your computer does the work, so long files take a little longer.',
    'Keep your original files. Converting again from an MP3 loses a little quality each time.',
  ],
  video: [
    'MP4 works on almost every phone, computer and website.',
    'Big videos take longer, because your computer does the work.',
    'Close other heavy apps if a long video is slow.',
  ],
  'gif-image': [
    'Short clips make small GIFs. Under 10 seconds works best.',
    'Fewer colors and a smaller size make a GIF load faster.',
  ],
  'ai-generators': [
    'Say who it is for and what mood you want. Details give better results.',
    'Not happy with the answer? Press generate again for a new version.',
    'AI tools need a free AI key. Add it once with the gear button.',
  ],
  marketing: [
    'Write for one person, not for everyone.',
    'Test two versions of an ad and keep the one that works.',
  ],
  utilities: [
    'Everything here runs in your browser. Nothing you type is sent anywhere.',
  ],
};

export const toolGuides = {
  'bulk-audio-converter': {
    tips: [
      'Pick MP3 if you are not sure. It plays on every device.',
      'WAV and FLAC keep perfect quality. Use them for editing.',
      '"Best sound" cannot add quality the original never had.',
      'Videos work too: you get just the sound.',
    ],
    next: ['bulk-audio-volume', 'bulk-audio-compressor', 'bulk-audio-speed', 'audio-equalizer'],
  },
  'bulk-audio-compressor': {
    tips: [
      'Standard quality is fine for most music and all speech.',
      'For podcasts and voice notes, the smallest size still sounds clear.',
      'Squeezing an already small file again saves very little.',
    ],
    next: ['bulk-audio-converter', 'bulk-audio-volume', 'bulk-audio-speed'],
  },
  'bulk-video-to-audio': {
    tips: [
      'The video must have sound in it. Silent videos give nothing back.',
      'Pick MP3 for listening, WAV if you want to edit the sound.',
    ],
    next: ['bulk-audio-volume', 'bulk-audio-compressor', 'vocal-remover'],
  },
  'bulk-audio-speed': {
    tips: [
      '1.25× to 1.5× is a comfortable speed for podcasts and lessons.',
      'Slowing music down helps you learn a song by ear.',
    ],
    next: ['pitch-shifter', 'bulk-audio-volume', 'bulk-audio-converter'],
  },
  'bulk-audio-volume': {
    tips: [
      'Go up in small steps. Too loud and the sound starts to crackle.',
      'Make all files the same loudness before putting them in one playlist.',
    ],
    next: ['audio-equalizer', 'bulk-audio-compressor', 'bulk-audio-converter'],
  },
  'vocal-remover': {
    tips: [
      'Works best when the singer is in the middle of a stereo song.',
      'Live recordings and mono files give weaker results.',
      'Some echo of the voice may remain. That is normal for this method.',
    ],
    next: ['pitch-shifter', 'bulk-audio-volume', 'audio-equalizer'],
  },
  'pitch-shifter': {
    tips: [
      'One step is one note. 12 steps up is a whole octave higher.',
      'Small changes (1 to 3 steps) sound the most natural.',
    ],
    next: ['bulk-audio-speed', 'vocal-remover', 'bulk-audio-converter'],
  },
  'audio-equalizer': {
    tips: [
      '"Clear voice" helps speech recorded on a phone.',
      '"Bass boost" suits music on small speakers.',
    ],
    next: ['bulk-audio-volume', 'bulk-audio-compressor', 'bulk-audio-converter'],
  },
  'voice-recorder': {
    tips: [
      'Allow the microphone when your browser asks.',
      'Record in a quiet room, about a hand away from the mic.',
    ],
    next: ['audio-equalizer', 'bulk-audio-volume', 'bulk-audio-converter'],
  },
  'bulk-video-converter': {
    tips: [
      'MP4 plays on almost every phone, computer and website. Pick it if you are not sure.',
      'If a video is already MP4, it is copied without any loss.',
      'WebM is great for putting videos on your own website.',
    ],
    next: ['bulk-video-compressor', 'video-trimmer', 'video-resizer'],
  },
  'bulk-video-compressor': {
    tips: [
      '"Balanced" keeps videos looking good at a much smaller size.',
      'Making the picture smaller (720p or 480p) saves the most space.',
      'Compressing a video that was already compressed loses a little quality each time.',
    ],
    next: ['video-trimmer', 'video-resizer', 'video-to-gif'],
  },
  'video-trimmer': {
    tips: [
      'Play the video, pause where you want to start, and press "Set start here".',
      '"Exact cut" starts on the exact frame. "Fast cut" keeps full quality but may start a moment early.',
    ],
    next: ['bulk-video-compressor', 'video-to-gif', 'video-muter'],
  },
  'video-cropper': {
    tips: [
      '9:16 is the shape for TikTok, Reels and Shorts.',
      'Cropping cuts away the edges; it never stretches the picture.',
    ],
    next: ['video-resizer', 'bulk-video-compressor', 'video-trimmer'],
  },
  'video-resizer': {
    tips: [
      '720p is sharp enough for most phones and much smaller than 1080p.',
      'Making a small video bigger does not add detail.',
    ],
    next: ['bulk-video-compressor', 'video-cropper', 'video-trimmer'],
  },
  'video-muter': {
    tips: [
      'The picture is copied without any loss, so this is quick.',
      'Want the sound as a file instead? Use Video to Audio.',
    ],
    next: ['bulk-video-to-audio', 'bulk-video-compressor', 'video-to-gif'],
  },
  'video-frame-extractor': {
    tips: [
      'PNG keeps every detail; JPG makes much smaller files.',
      'Many pictures come back together in one .zip.',
    ],
    next: ['first-last-frame-extractor', 'gif-maker', 'image-splitter'],
  },
  'first-last-frame-extractor': {
    tips: [
      'The first frame often makes a good thumbnail.',
      'Add many videos at once to get all their thumbnails in one go.',
    ],
    next: ['video-frame-extractor', 'image-hue-adjuster', 'video-trimmer'],
  },
  'watermark-remover': {
    tips: [
      'Draw the box a little bigger than the logo for the cleanest result.',
      'It hides the logo; it cannot bring back what was underneath.',
      'Only remove watermarks from videos you have the right to use.',
    ],
    next: ['video-cropper', 'bulk-video-compressor', 'video-trimmer'],
  },
  'text-to-speech': {
    tips: [
      'The voices come from your device, so they differ between computers and phones.',
      'Add commas and full stops to get natural pauses.',
    ],
    next: ['voice-recorder', 'bulk-audio-converter', 'bulk-audio-volume'],
  },
};
