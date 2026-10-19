import LegalPage from '../ui/LegalPage';

const SECTIONS = [
  {
    title: 'Agreeing to these terms',
    body: ['By using AudioBulk, you agree to these terms. If you don’t agree, please don’t use the site.'],
  },
  {
    title: 'What AudioBulk is',
    body: [
      'AudioBulk is a set of free tools that run in your web browser: audio, video, GIF and image tools, AI writing tools, and everyday helpers.',
      'The tools come “as is”. We may change, pause or remove any tool, or the whole site, at any time and without notice.',
    ],
  },
  {
    title: 'Keep copies of your files',
    body: [
      'Because your files are processed on your own computer and never uploaded, we can’t recover them for you. Always keep a copy of your original files.',
      'We are not responsible for lost, damaged or changed files, during or after using a tool.',
    ],
  },
  {
    title: 'Use the tools fairly',
    body: [
      'Don’t use AudioBulk to process or share anything illegal, or anything you don’t have the right to use, such as other people’s copyrighted work.',
      'Don’t use the AI tools to create content that is harmful, harassing, untrue about real people, or against the law.',
      'Don’t try to hack, break or disrupt the site.',
    ],
  },
  {
    title: 'Who owns what',
    body: [
      'The AudioBulk site, its design and its features belong to AudioBulk and are protected by copyright and similar laws. The source code is published on GitHub under the MIT license.',
      'Your files, and anything you make with the tools, stay yours.',
    ],
  },
  {
    title: 'No promises',
    body: ['We work hard to make the tools reliable, but we can’t promise they will always work, be error-free, or suit a particular purpose.'],
  },
  {
    title: 'Limits on our responsibility',
    body: ['AudioBulk is not responsible for any loss or damage, including lost files, lost data, lost profit or interrupted business, that comes from using the site or not being able to use it.'],
  },
];

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for using AudioBulk, in plain words."
      updated="19 October 2026"
      sections={SECTIONS}
    />
  );
}
