import { WalkthroughStep } from '../components/Walkthrough';

export const generatePageSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    target: 'body', // Will be centered
    title: '🎨 Welcome to AI Logo Maker!',
    content: 'Let\'s take a quick tour to help you create amazing logos with AI. This will only take a minute!',
    position: 'center',
    nextButton: 'Start Tour'
  },
  {
    id: 'chat-panel',
    target: '[data-walkthrough="chat-panel"]',
    title: '💬 Chat with AI',
    content: 'This is where you describe the logo you want to create. Just type naturally - like "modern tech company logo" or "vintage coffee shop badge".',
    position: 'right',
    nextButton: 'Got it'
  },
  {
    id: 'style-selector',
    target: '[data-walkthrough="style-selector"]',
    title: '🎨 Choose Your Style',
    content: 'Pick from different styles like Modern, Flat, 3D, or Minimalist. Each style gives your logos a unique look and feel.',
    position: 'top',
    nextButton: 'Next'
  },
  {
    id: 'prompt-input',
    target: '[data-walkthrough="prompt-input"]',
    title: '✍️ Describe Your Logo',
    content: 'Type your logo description here. Be specific! Instead of "logo", try "blue tech logo with geometric shapes" for better results.',
    position: 'top',
    nextButton: 'Continue'
  },
  {
    id: 'generate-button',
    target: '[data-walkthrough="generate-button"]',
    title: '🚀 Generate Logos',
    content: 'Click this button to create your logos! The AI will generate multiple variations based on your description.',
    position: 'left',
    nextButton: 'Awesome'
  },
  {
    id: 'results-panel',
    target: '[data-walkthrough="results-panel"]',
    title: '🎯 Your Generated Logos',
    content: 'Your logos will appear here! You can improve any logo by clicking on it, or download the ones you love.',
    position: 'left',
    nextButton: 'Nice'
  },
  {
    id: 'improve-icons',
    target: '[data-walkthrough="results-panel"]',
    title: '✨ Improve Your Logos',
    content: 'Click on any generated logo to enter improvement mode. Then describe changes like "make it more colorful", "add shadows", or "change to blue" to refine your logo.',
    position: 'left',
    nextButton: 'Perfect'
  },
  {
    id: 'sidebar-navigation',
    target: '[data-walkthrough="sidebar"]',
    title: '🧭 Navigation',
    content: 'Use the sidebar to navigate between generating logos, viewing your library, checking usage limits, and getting help.',
    position: 'right',
    nextButton: 'Finish'
  }
];

export const improvementModeSteps: WalkthroughStep[] = [
  {
    id: 'improvement-welcome',
    target: '[data-walkthrough="improvement-panel"]',
    title: '✨ Logo Improvement Mode',
    content: 'Great! Now you can refine this logo. Describe what changes you\'d like - "make it more colorful", "add shadows", or "change to blue".',
    position: 'right',
    nextButton: 'Got it'
  },
  {
    id: 'improvement-suggestions',
    target: '[data-walkthrough="improvement-suggestions"]',
    title: '💡 Quick Suggestions',
    content: 'Use these quick suggestion buttons for common improvements, or type your own custom changes in the input field.',
    position: 'right',
    nextButton: 'Perfect'
  }
];