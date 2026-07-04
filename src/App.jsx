import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AllTools from './pages/AllTools';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Tool Pages
const VocalRemover = lazy(() => import('./pages/tools/VocalRemover'));
const PitchShifter = lazy(() => import('./pages/tools/PitchShifter'));
const AudioEqualizer = lazy(() => import('./pages/tools/AudioEqualizer'));
const VoiceRecorder = lazy(() => import('./pages/tools/VoiceRecorder'));
const TextToSpeech = lazy(() => import('./pages/tools/TextToSpeech'));
const FirstLastFrameExtractor = lazy(() => import('./pages/tools/FirstLastFrameExtractor'));
const BulkVideoConverter = lazy(() => import('./pages/tools/BulkVideoConverter'));
const VideoTrimmer = lazy(() => import('./pages/tools/VideoTrimmer'));
const VideoCropper = lazy(() => import('./pages/tools/VideoCropper'));
const VideoResizer = lazy(() => import('./pages/tools/VideoResizer'));
const VideoMuter = lazy(() => import('./pages/tools/VideoMuter'));

const VideoToGif = lazy(() => import('./pages/tools/VideoToGif'));
const GifToVideo = lazy(() => import('./pages/tools/GifToVideo'));
const GifCompressor = lazy(() => import('./pages/tools/GifCompressor'));
const GifMaker = lazy(() => import('./pages/tools/GifMaker'));
const GifEditor = lazy(() => import('./pages/tools/GifEditor'));
const ImageSplitter = lazy(() => import('./pages/tools/ImageSplitter'));
const ColorPicker = lazy(() => import('./pages/tools/ColorPicker'));
const ImageHueAdjuster = lazy(() => import('./pages/tools/ImageHueAdjuster'));
const MetaAdPreview = lazy(() => import('./pages/tools/MetaAdPreview'));
const AiNamingAds = lazy(() => import('./pages/tools/AiNamingAds'));
const CreativeCalculator = lazy(() => import('./pages/tools/CreativeCalculator'));
const FbEmojisHub = lazy(() => import('./pages/tools/FbEmojisHub'));
const ChatgptAdPrompts = lazy(() => import('./pages/tools/ChatgptAdPrompts'));
const JsonSqlFormatter = lazy(() => import('./pages/tools/JsonSqlFormatter'));
const PasswordGenerator = lazy(() => import('./pages/tools/PasswordGenerator'));
const TextSimilarity = lazy(() => import('./pages/tools/TextSimilarity'));
const FaqGenerator = lazy(() => import('./pages/tools/FaqGenerator'));
const TextRephrase = lazy(() => import('./pages/tools/TextRephrase'));
const UuidGenerator = lazy(() => import('./pages/tools/UuidGenerator'));

const BulkAudioConverter = lazy(() => import('./pages/tools/BulkAudioConverter'));
const BulkVideoCompressor = lazy(() => import('./pages/tools/BulkVideoCompressor'));
const BulkVideoToAudioConverter = lazy(() => import('./pages/tools/BulkVideoToAudioConverter'));
const BulkSpeedChanger = lazy(() => import('./pages/tools/BulkSpeedChanger'));
const BulkVolumeChanger = lazy(() => import('./pages/tools/BulkVolumeChanger'));
const VideoFrameExtractor = lazy(() => import('./pages/tools/VideoFrameExtractor'));
const WordCounter = lazy(() => import('./pages/tools/WordCounter'));
const EmojiPicker = lazy(() => import('./pages/tools/EmojiPicker'));
const AdCostCalculator = lazy(() => import('./pages/tools/AdCostCalculator'));
const BulkAudioCompressor = lazy(() => import('./pages/tools/BulkAudioCompressor'));

// AI Tools
const StoryPlotGenerator = lazy(() => import('./pages/tools/StoryPlotGenerator'));
const AiStoryGenerator = lazy(() => import('./pages/tools/AiStoryGenerator'));
const StoryOutlineGenerator = lazy(() => import('./pages/tools/StoryOutlineGenerator'));
const StoryRewriter = lazy(() => import('./pages/tools/StoryRewriter'));
const StorySummarizer = lazy(() => import('./pages/tools/StorySummarizer'));
const ContinueWriting = lazy(() => import('./pages/tools/ContinueWriting'));
const ChapterGenerator = lazy(() => import('./pages/tools/ChapterGenerator'));
const BookTitleGenerator = lazy(() => import('./pages/tools/BookTitleGenerator'));
const PoemGenerator = lazy(() => import('./pages/tools/PoemGenerator'));
const LyricsGenerator = lazy(() => import('./pages/tools/LyricsGenerator'));
const TvShowGenerator = lazy(() => import('./pages/tools/TvShowGenerator'));
const DialogueGenerator = lazy(() => import('./pages/tools/DialogueGenerator'));
const DialogueEnhancer = lazy(() => import('./pages/tools/DialogueEnhancer'));
const WorldBuildingGenerator = lazy(() => import('./pages/tools/WorldBuildingGenerator'));
const PlanetGenerator = lazy(() => import('./pages/tools/PlanetGenerator'));
const CountryMaker = lazy(() => import('./pages/tools/CountryMaker'));
const FactionGenerator = lazy(() => import('./pages/tools/FactionGenerator'));
const FantasyCurrencyGenerator = lazy(() => import('./pages/tools/FantasyCurrencyGenerator'));
const ArtifactGenerator = lazy(() => import('./pages/tools/ArtifactGenerator'));
const SpellGenerator = lazy(() => import('./pages/tools/SpellGenerator'));
const QuestGenerator = lazy(() => import('./pages/tools/QuestGenerator'));
const BossGenerator = lazy(() => import('./pages/tools/BossGenerator'));
const SuperpowerGenerator = lazy(() => import('./pages/tools/SuperpowerGenerator'));
const RomanticScenario = lazy(() => import('./pages/tools/RomanticScenario'));
const CharacterOutfit = lazy(() => import('./pages/tools/CharacterOutfit'));
const AiCharacter = lazy(() => import('./pages/tools/AiCharacter'));
const YtVideoIdeas = lazy(() => import('./pages/tools/YtVideoIdeas'));
const YtDescriptionGen = lazy(() => import('./pages/tools/YtDescriptionGen'));
const YtChannelName = lazy(() => import('./pages/tools/YtChannelName'));
const NewsletterGenerator = lazy(() => import('./pages/tools/NewsletterGenerator'));


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="all-tools" element={<AllTools />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          
          {/* Phase 1 Tools */}
          <Route path="tools/bulk-audio-converter" element={<BulkAudioConverter />} />
          <Route path="tools/bulk-audio-compressor" element={<BulkAudioCompressor />} />
          <Route path="tools/bulk-video-compressor" element={<BulkVideoCompressor />} />
          <Route path="tools/bulk-video-to-audio" element={<BulkVideoToAudioConverter />} />
          <Route path="tools/bulk-audio-speed" element={<BulkSpeedChanger />} />
          <Route path="tools/bulk-audio-volume" element={<BulkVolumeChanger />} />
          <Route path="tools/video-frame-extractor" element={<VideoFrameExtractor />} />

          {/* Phase 2 Tools */}
          <Route path="tools/word-counter" element={<WordCounter />} />
          <Route path="tools/emoji-picker" element={<EmojiPicker />} />
          <Route path="tools/fb-ad-cost" element={<AdCostCalculator />} />
          
          {/* Generated Routes */}
          <Route path="tools/vocal-remover" element={<VocalRemover />} />
          <Route path="tools/pitch-shifter" element={<PitchShifter />} />
          <Route path="tools/audio-equalizer" element={<AudioEqualizer />} />
          <Route path="tools/voice-recorder" element={<VoiceRecorder />} />
          <Route path="tools/text-to-speech" element={<TextToSpeech />} />
          <Route path="tools/first-last-frame-extractor" element={<FirstLastFrameExtractor />} />
          <Route path="tools/bulk-video-converter" element={<BulkVideoConverter />} />
          <Route path="tools/video-trimmer" element={<VideoTrimmer />} />
          <Route path="tools/video-cropper" element={<VideoCropper />} />
          <Route path="tools/video-resizer" element={<VideoResizer />} />
          <Route path="tools/video-muter" element={<VideoMuter />} />

          <Route path="tools/video-to-gif" element={<VideoToGif />} />
          <Route path="tools/gif-to-video" element={<GifToVideo />} />
          <Route path="tools/gif-compressor" element={<GifCompressor />} />
          <Route path="tools/gif-maker" element={<GifMaker />} />
          <Route path="tools/gif-editor" element={<GifEditor />} />
          <Route path="tools/image-splitter" element={<ImageSplitter />} />
          <Route path="tools/color-picker" element={<ColorPicker />} />
          <Route path="tools/image-hue-adjuster" element={<ImageHueAdjuster />} />
          <Route path="tools/meta-ad-preview" element={<MetaAdPreview />} />
          <Route path="tools/ai-naming-ads" element={<AiNamingAds />} />
          <Route path="tools/creative-calculator" element={<CreativeCalculator />} />
          <Route path="tools/fb-emojis-hub" element={<FbEmojisHub />} />
          <Route path="tools/chatgpt-ad-prompts" element={<ChatgptAdPrompts />} />
          <Route path="tools/json-sql-formatter" element={<JsonSqlFormatter />} />
          <Route path="tools/password-generator" element={<PasswordGenerator />} />
          <Route path="tools/text-similarity" element={<TextSimilarity />} />
          <Route path="tools/faq-generator" element={<FaqGenerator />} />
          <Route path="tools/text-rephrase" element={<TextRephrase />} />
          <Route path="tools/uuid-generator" element={<UuidGenerator />} />

          {/* AI Tools */}
          <Route path="tools/story-plot-generator" element={<StoryPlotGenerator />} />
          <Route path="tools/ai-story-generator" element={<AiStoryGenerator />} />
          <Route path="tools/story-outline-generator" element={<StoryOutlineGenerator />} />
          <Route path="tools/story-rewriter" element={<StoryRewriter />} />
          <Route path="tools/story-summarizer" element={<StorySummarizer />} />
          <Route path="tools/continue-writing" element={<ContinueWriting />} />
          <Route path="tools/chapter-generator" element={<ChapterGenerator />} />
          <Route path="tools/book-title-generator" element={<BookTitleGenerator />} />
          <Route path="tools/poem-generator" element={<PoemGenerator />} />
          <Route path="tools/lyrics-generator" element={<LyricsGenerator />} />
          <Route path="tools/tv-show-generator" element={<TvShowGenerator />} />
          <Route path="tools/dialogue-generator" element={<DialogueGenerator />} />
          <Route path="tools/dialogue-enhancer" element={<DialogueEnhancer />} />
          <Route path="tools/world-building-generator" element={<WorldBuildingGenerator />} />
          <Route path="tools/planet-generator" element={<PlanetGenerator />} />
          <Route path="tools/country-maker" element={<CountryMaker />} />
          <Route path="tools/faction-generator" element={<FactionGenerator />} />
          <Route path="tools/fantasy-currency-generator" element={<FantasyCurrencyGenerator />} />
          <Route path="tools/artifact-generator" element={<ArtifactGenerator />} />
          <Route path="tools/spell-generator" element={<SpellGenerator />} />
          <Route path="tools/quest-generator" element={<QuestGenerator />} />
          <Route path="tools/boss-generator" element={<BossGenerator />} />
          <Route path="tools/superpower-generator" element={<SuperpowerGenerator />} />
          <Route path="tools/romantic-scenario" element={<RomanticScenario />} />
          <Route path="tools/character-outfit" element={<CharacterOutfit />} />
          <Route path="tools/ai-character" element={<AiCharacter />} />
          <Route path="tools/yt-video-ideas" element={<YtVideoIdeas />} />
          <Route path="tools/yt-description-gen" element={<YtDescriptionGen />} />
          <Route path="tools/yt-channel-name" element={<YtChannelName />} />
          <Route path="tools/newsletter-generator" element={<NewsletterGenerator />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
