import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://gramaiofficial.lovable.app';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({ title, description, path, jsonLd }: SEOProps) {
  const location = useLocation();
  const url = `${SITE_URL}${path ?? location.pathname}`;
  const fullTitle = title.includes('Gram AI') ? title : `${title} | Gram AI`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}