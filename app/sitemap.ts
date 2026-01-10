import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ai-logo-builder.com'
  const currentDate = new Date()

  return [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    
    // SEO Landing Pages - high priority for organic traffic (main content pages)
    {
      url: `${baseUrl}/ai-logo-generator`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/app-logo-maker`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/png-logo-generator`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/favicon-generator-ai`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brand-logo-maker`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Auth pages - lower priority, users may need to access but not main content
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    
    // Legal & Policy pages - required but low priority
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    
    // Note: Protected pages (generate, library, account, usage) are excluded from sitemap
    // as they have robots: { index: false } and require authentication.
    // These pages redirect to login for non-authenticated users, so they're not ideal for SEO indexing.
  ]
}

