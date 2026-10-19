import { Helmet } from 'react-helmet-async';
import { toolsList } from '../data/tools';

export default function SeoMeta({ title, description, url = 'https://audiobulk.com', image = 'https://audiobulk.com/og-image.png' }) {
  const siteName = 'AudioBulk';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName}: ${toolsList.length} free tools for audio, video, GIFs and writing`;
  const defaultDescription = `${toolsList.length} free tools for audio, video, GIFs and AI writing that work in your browser. No ads, no sign-up, and your files never leave your computer.`;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
}
