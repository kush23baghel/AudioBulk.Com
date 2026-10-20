import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './ui/Shell';
import Home from './pages/Home';
import AllTools from './pages/AllTools';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';
import { toolsList } from './data/tools';
import { aiTools } from './data/aiTools';

const page = (name) => lazy(() => import(`./pages/tools/${name}.jsx`));

// Every non-AI tool: URL id → page file in src/pages/tools/.
const TOOL_PAGES = {
  // Audio
  'bulk-audio-converter': page('BulkAudioConverter'),
  'bulk-audio-compressor': page('BulkAudioCompressor'),
  'bulk-video-to-audio': page('BulkVideoToAudioConverter'),
  'bulk-audio-speed': page('BulkSpeedChanger'),
  'bulk-audio-volume': page('BulkVolumeChanger'),
  'vocal-remover': page('VocalRemover'),
  'pitch-shifter': page('PitchShifter'),
  'audio-equalizer': page('AudioEqualizer'),
  'voice-recorder': page('VoiceRecorder'),
  'text-to-speech': page('TextToSpeech'),
  // Video
  'bulk-video-converter': page('BulkVideoConverter'),
  'bulk-video-compressor': page('BulkVideoCompressor'),
  'video-trimmer': page('VideoTrimmer'),
  'video-cropper': page('VideoCropper'),
  'video-resizer': page('VideoResizer'),
  'video-muter': page('VideoMuter'),
  'video-frame-extractor': page('VideoFrameExtractor'),
  'first-last-frame-extractor': page('FirstLastFrameExtractor'),
  'watermark-remover': page('WatermarkRemover'),
  // GIF & images
  'video-to-gif': page('VideoToGif'),
  'gif-to-video': page('GifToVideo'),
  'gif-compressor': page('GifCompressor'),
  'gif-maker': page('GifMaker'),
  'gif-editor': page('GifEditor'),
  'image-splitter': page('ImageSplitter'),
  'color-picker': page('ColorPicker'),
  'image-hue-adjuster': page('ImageHueAdjuster'),
  // Marketing (non-AI)
  'meta-ad-preview': page('MetaAdPreview'),
  'ai-naming-ads': page('AiNamingAds'),
  'creative-calculator': page('CreativeCalculator'),
  'fb-emojis-hub': page('FbEmojisHub'),
  'fb-ad-cost': page('AdCostCalculator'),
  'chatgpt-ad-prompts': page('ChatgptAdPrompts'),
  // Everyday
  'word-counter': page('WordCounter'),
  'emoji-picker': page('EmojiPicker'),
  'json-sql-formatter': page('JsonSqlFormatter'),
  'password-generator': page('PasswordGenerator'),
  'text-similarity': page('TextSimilarity'),
  'uuid-generator': page('UuidGenerator'),
};

// All 32 AI writing tools share one page, driven by src/data/aiTools.js.
const AiTool = lazy(() => import('./ui/AiTool'));
const pathOf = (id) => toolsList.find((t) => t.id === id)?.path.replace(/^\//, '');

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="all-tools" element={<AllTools />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          {Object.entries(TOOL_PAGES).map(([id, Page]) => (
            <Route key={id} path={pathOf(id)} element={<Page />} />
          ))}
          {Object.keys(aiTools).map((id) => (
            <Route key={id} path={pathOf(id)} element={<AiTool id={id} />} />
          ))}
          {/* Real 404 (noindex) instead of silently serving Home at every unknown URL */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
