export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Logo Builder',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    applicationSubCategory: 'Logo Design Software',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Pack',
        price: '5.00',
        priceCurrency: 'USD',
        description: '25 credits one-time purchase for AI logo generation',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '10.00',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '10.00',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: '50 credits per month for AI logo generation with logo improvement features',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro Yearly',
        price: '96.00',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '96.00',
          priceCurrency: 'USD',
          billingDuration: 'P1Y',
        },
        description: '700 credits per year (including 100 bonus credits) for AI logo generation',
        availability: 'https://schema.org/InStock',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'Generate professional-grade logos instantly with AI-powered technology using GPT Image 1. Create custom logos for your business, brand, or startup. Perfect for designers, developers, entrepreneurs, and content creators.',
    featureList: [
      'AI-powered logo generation with GPT Image 1',
      '10+ style options (Modern, Gaming, Corporate, Creative, Minimalist, Bold, Elegant, Tech, Vintage, Hand-drawn)',
      'High-resolution PNG export',
      'Personal logo library storage',
      'Logo improvement & iteration',
      'Full commercial usage rights',
      'Instant generation in under 30 seconds',
      'Multiple variations per generation',
    ],
    screenshot: 'https://ai-logo-builder.com/images/AI-Logo-Generator-Logo.png',
    softwareVersion: '2.0',
    releaseNotes: 'Advanced AI logo generation with multiple styles and improvement features',
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Logo Builder',
    url: 'https://ai-logo-builder.com',
    logo: 'https://ai-logo-builder.com/images/AI-Logo-Generator-Logo.png',
    description: 'Professional AI-powered logo generation platform for designers, developers, entrepreneurs, and businesses. Create custom logos instantly with advanced AI technology.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English'],
    },
    sameAs: [],
  }

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Logo Builder',
    url: 'https://ai-logo-builder.com',
    description: 'Generate professional-grade logos instantly with AI-powered technology. Create custom logos for your business, brand, or startup.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://ai-logo-builder.com/generate?prompt={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://ai-logo-builder.com',
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  )
}

