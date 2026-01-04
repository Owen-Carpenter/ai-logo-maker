import React from 'react';
import MarketingPageLayout from '../../../components/MarketingPageLayout';

export const metadata = {
  title: 'AI Logo Builder | Create Custom Logos with AI',
  description: 'Generate professional custom logos in seconds with our AI Logo Builder. Perfect for apps, websites, and branding.',
};

export default function AiLogoGeneratorPage() {
  return (
    <MarketingPageLayout
      h1Title={
        <>
          Generate <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Professional</span> Logos
        </>
      }
      h2Subtitle="Create professional custom logos and brand identities in seconds with our advanced AI Logo Builder."
    />
  );
}
