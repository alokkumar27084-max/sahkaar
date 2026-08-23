import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "SahKaari";
const SITE_URL = "https://sahkaari.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
const DEFAULT_DESCRIPTION = "SahKaari connects households and institutions with verified skilled workers from registered Labour Cooperative Federations and Societies. 100% verified, welfare protected, transparent escrow.";

/**
 * SEOHead — Drop this into any page for full SEO coverage.
 *
 * Props:
 *   title      — Tab title (will append " | Thekedaar" automatically)
 *   description — Meta description
 *   ogImage    — Open Graph image URL
 *   canonical  — Canonical URL (defaults to window.location.href)
 *   structuredData — JSON-LD object or array (schema.org)
 *   noIndex    — Prevent indexing (e.g., admin dashboard)
 */
export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  structuredData,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Contractors in India`;
  const canonicalUrl = canonical || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const structuredArray = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  // Default WebSite structured data
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const allSchemas = structuredArray.length > 0 ? structuredArray : [websiteSchema];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* WhatsApp preview (uses OG tags, this is just for clarity) */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* JSON-LD structured data */}
      {allSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
