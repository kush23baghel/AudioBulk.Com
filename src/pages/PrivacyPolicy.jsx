import LegalPage from '../ui/LegalPage';

const SECTIONS = [
  {
    title: 'Your files stay on your computer',
    body: [
      'Almost every AudioBulk tool (audio, video, GIF and image) works inside your web browser, on your own device.',
      'Your files are never uploaded to our servers, never stored online, and never seen by us or anyone else.',
    ],
  },
  {
    title: 'AI writing tools',
    body: [
      'The AI writing tools send the text you type to OpenRouter, an outside AI service, so it can write the answer. This only happens when you press the button to generate something.',
      'If you add your own AI key, it is saved only in your browser. It is sent only to OpenRouter, never to AudioBulk.',
      'OpenRouter and the AI companies behind each model (such as Meta, Anthropic or Google) have their own privacy rules for the text they receive. Please read them if this matters to you.',
    ],
  },
  {
    title: 'What we collect',
    body: [
      'No account: you never need to sign up, give an email address or share who you are.',
      'Visit counts: we may count visits and which tools are popular, without anything that identifies you, so we know what to improve.',
      'Saved settings: your browser stores a few things for you, such as your recently used tools and your AI key, so they are still there next time. This stays on your device.',
    ],
  },
  {
    title: 'Outside services',
    body: [
      'To load fonts, icons and the audio and video engine, your browser downloads files from a few outside services (Google Fonts, cdnjs and unpkg). Like any website, they can see your IP address when your browser asks for those files.',
      'Links to other websites follow those websites’ own privacy rules.',
    ],
  },
  {
    title: 'Changes to this page',
    body: ['If this policy changes, we will update this page and the date at the top.'],
  },
  {
    title: 'Questions',
    body: ['If you have a question about privacy, open an issue on our GitHub page: github.com/kush23baghel/AudioBulk.Com.'],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="The short version: your files never leave your computer, and we don't need to know who you are."
      updated="19 October 2026"
      sections={SECTIONS}
    />
  );
}
