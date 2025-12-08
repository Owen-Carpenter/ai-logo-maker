import React from 'react';
import MarketingPageLayout from '../../../components/MarketingPageLayout';

export const metadata = {
  title: 'Brand Logo Maker | Create Consistent Brand Identities',
  description: 'Generate cohesive, consistent brand logos for your business identity. Maintain style across your entire brand automatically.',
};

export default function BrandLogoMakerPage() {
  return (
    <MarketingPageLayout
      h1Title={
        <>
          Build Your <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Brand</span>
        </>
      }
      h2Subtitle="Build consistent, cohesive brand identities for your entire business in minutes with AI-powered generation."
    />
  );
}
