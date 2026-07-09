import { Helmet } from "react-helmet-async";

const SITE = "https://studytimer0p.lovable.app";

interface SEOProps {
  title: string;
  description: string;
  path: string;
}

export default function SEO({ title, description, path }: SEOProps) {
  const url = `${SITE}${path}`;
  const fullTitle = title.includes("MatrixMindset") ? title : `${title} — MatrixMindset`;
  const desc = description.slice(0, 158);
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  );
}
