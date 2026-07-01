import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SeoMeta({ title, description, url = 'https://audiobulk.com', image = 'https://audiobulk.com/og-image.png' }) {
  const siteName = 'AudioBulk';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - 70+ Free Browser-Based Tools`;
  const defaultDescription = 'Your ultimate browser-based toolkit. 70 free tools for audio, video, GIF, AI writing & more. 100% private and runs locally.';
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
