export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Logo Generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Base Plan',
        price: '5.00',
        priceCurrency: 'USD',
        description: '25 credits per month for AI logo generation',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '10.00',
        priceCurrency: 'USD',
        description: '100 credits per month for AI logo generation',
      },
      {
        '@type': 'Offer',
        name: 'Pro+ Plan',
        price: '15.00',
        priceCurrency: 'USD',
        description: '200 credits per month for AI logo generation',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    description: 'Create professional-grade logos with AI-powered generation using GPT Image 1. Perfect for designers, developers, and content creators.',
    featureList: [
      'AI-powered logo generation',
      'Multiple style options',
      'PNG export',
      'Logo library storage',
      'Logo improvement & iteration',
      'Commercial usage rights',
    ],
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Logo Generator',
    url: 'https://ai-icon-maker.com',
    logo: 'https://ai-icon-maker.com/images/AI-Logo-Generator-Logo.png',
    description: 'Professional AI-powered logo generation platform for designers and developers',
    sameAs: [],
  }

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Logo Generator',
    url: 'https://ai-icon-maker.com',
    description: 'Create professional-grade logos with AI',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://ai-icon-maker.com/generate?prompt={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  )
}

