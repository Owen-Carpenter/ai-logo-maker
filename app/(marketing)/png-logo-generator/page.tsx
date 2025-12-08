import React from 'react';
import MarketingPageLayout from '../../../components/MarketingPageLayout';

export const metadata = {
  title: 'PNG Logo Generator | High-Resolution Logos with AI',
  description: 'Create crisp, high-resolution PNG logos perfect for web, print, and professional branding.',
};

export default function PngLogoGeneratorPage() {
  return (
    <MarketingPageLayout
      h1Title={
        <>
          Create <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">PNG</span> Logos
        </>
      }
      h2Subtitle="Generate crisp, high-resolution PNG logos perfect for modern branding and professional projects."
    />
  );
}
