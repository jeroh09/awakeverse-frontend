// src/components/SEO/SEOHead.jsx
// Reusable SEO component using react-helmet-async
// Add to any page component that needs custom meta tags

import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT = {
  title: 'AwakeVerse — The Multi-AI Platform | Conversations Without Limits',
  description:
    'Have real conversations with AI characters — historical figures, mythological personas, and original creations. Run multi-character dialogues, collaborative stories, and AI team workspaces.',
  image: 'https://awakeverse.com/awakeverse-social-card.jpg',
  url: 'https://awakeverse.com/',
  type: 'website',
};

/**
 * SEOHead — drop into any page component to set custom meta tags.
 *
 * Usage:
 *   <SEOHead
 *     title="What is the Verse Engine? | AwakeVerse"
 *     description="The Verse Engine coordinates independent AI character perspectives in real time."
 *     url="https://awakeverse.com/use-cases/education"
 *   />
 *
 * All props are optional — falls back to site-wide defaults.
 */
export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
}) {
  const seo = {
    title: title || DEFAULT.title,
    description: description || DEFAULT.description,
    image: image || DEFAULT.image,
    url: url || DEFAULT.url,
    type,
  };

  return (
    <Helmet>
      {/* Primary */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={seo.url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={seo.type} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AwakeVerse" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@awakeverse_ai" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
}