import React from 'react';
import MarketingPageLayout from '../../../components/MarketingPageLayout';

export const metadata = {
  title: 'App Logo Maker | Generate iOS & Android App Logos',
  description: 'Create stunning app logos for iOS and Android in seconds. The best AI App Logo Maker for developers and indie hackers.',
};

export default function AppLogoMakerPage() {
  return (
    <MarketingPageLayout
      h1Title="AI App Logo Maker for iOS & Android"
      h2Subtitle="Design the perfect app logo for the App Store and Google Play in seconds with AI-powered generation."
    />
  );
}
