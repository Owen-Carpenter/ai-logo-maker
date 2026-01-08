'use client';

import { useState, useEffect, useRef } from 'react';
import { downloadPNGImage, generateFileName } from '../../lib/download-utils';

interface LogoDisplayPanelProps {
  generatedImages: string[];
  isGenerating: boolean;
  onRegenerate: () => void;
  onReset: () => void;
  onSelectImage: (imageUrl: string) => void;
  onImproveLogo: (imageUrl: string) => void;
  isImprovementMode?: boolean;
  onExitImprovementMode?: () => void;
  selectedLogoUrl?: string;
  currentPrompt?: string;
  currentStyle?: string;
  currentColor?: string;
  onStreamingThoughts?: (thoughts: string) => void;
  streamedThoughts?: string;
  mobileCompactMode?: boolean;
}

export default function LogoDisplayPanel({ 
  generatedImages, 
  isGenerating, 
  onRegenerate, 
  onReset, 
  onSelectImage,
  onImproveLogo,
  isImprovementMode = false,
  onExitImprovementMode,
  selectedLogoUrl,
  currentPrompt,
  currentStyle,
  currentColor,
  onStreamingThoughts,
  streamedThoughts,
  mobileCompactMode = false
}: LogoDisplayPanelProps) {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedLogoCode, setSelectedLogoCode] = useState('');
  const [savingLogoId, setSavingLogoId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [logoToSave, setLogoToSave] = useState<string>('');
  const [extractedSvgCodes, setExtractedSvgCodes] = useState<string[]>([]);
  const dalleThoughts = useState<string>('');
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [showExpandedImage, setShowExpandedImage] = useState(false);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string>('');
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null);

  // Since we're only using PNG images now, we don't need SVG extraction logic
  useEffect(() => {
    if (generatedImages.length > 0) {
      setExtractedSvgCodes(['SVG code not available - this logo is stored as PNG']);
    } else {
      setExtractedSvgCodes([]);
    }
    // Reset selected logo when new images are generated
    setSelectedLogoIndex(null);
  }, [generatedImages]);

  // Function to save logo to library
  const handleSaveToLibrary = async (imageUrl: string, logoName: string) => {
    setSavingLogoId(imageUrl);
    
    try {
      const response = await fetch('/api/icons/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: logoName,
          prompt: currentPrompt,
          style: currentStyle,
          color: currentColor,
          image_url: imageUrl,
          format: 'PNG',
          tags: currentPrompt ? [currentPrompt.split(' ')[0]] : []
        }),
      });

      if (response.ok) {
        // Redirect to library page
        window.location.href = '/library';
      } else {
        throw new Error('Failed to save logo');
      }
    } catch (error) {
      console.error('Error saving logo:', error);
      alert('Failed to save logo to library. Please try again.');
    } finally {
      setSavingLogoId(null);
      setShowSaveModal(false);
    }
  };

  const openSaveModal = (imageUrl: string) => {
    setLogoToSave(imageUrl);
    setShowSaveModal(true);
  };

  // Handle downloading the PNG logo
  const handleDownload = async (imageUrl: string, logoName?: string) => {
    try {
      // Generate filename based on prompt or generic name
      const baseName = logoName || currentPrompt || 'generated-logo';
      
      // Download the actual PNG image that was generated
      await downloadPNGImage(imageUrl, baseName);
      
      // Call the original onSelectImage callback for any additional functionality
      onSelectImage(imageUrl);
    } catch (error) {
      console.error('Error downloading PNG logo:', error);
      alert('Failed to download PNG logo. Please try again.');
    }
  };

  // Reset thoughts when generation starts or stops
  useEffect(() => {
    if (isGenerating) {
      // Reset GPT Image 1.5 thoughts
    }
  }, [isGenerating]);

  // Auto-scroll to bottom when new content is added (only if user hasn't scrolled up)
  useEffect(() => {
    if (thoughtsContainerRef.current && streamedThoughts && !userHasScrolledUp) {
      const container = thoughtsContainerRef.current;
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);
        
        // Only scroll to bottom if user hasn't manually scrolled up
        container.scrollTop = maxScroll;
      });
    }
  }, [streamedThoughts, userHasScrolledUp]);

  // Reset scroll state when generation starts
  useEffect(() => {
    if (isGenerating) {
      setUserHasScrolledUp(false);
    }
  }, [isGenerating]);

  // Detect when user manually scrolls
  useEffect(() => {
    const container = thoughtsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const currentScroll = container.scrollTop;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      
      // User is near bottom (within 50px) - enable auto-scroll
      if (maxScroll - currentScroll < 50) {
        setUserHasScrolledUp(false);
      } else {
        // User has scrolled up significantly - disable auto-scroll
        setUserHasScrolledUp(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShowCode = (imageUrl: string) => {
    // Since we're only using PNG images now, show a message that SVG code is not available
    setSelectedLogoCode('SVG code is not available for PNG images. This logo is stored as a PNG image.');
    setShowCodeModal(true);
  };

  return (
    <div 
      data-walkthrough="results-panel"
      className="flex-1 flex flex-col h-full min-h-0 relative bg-gradient-to-b from-white via-blue-50 to-blue-100"
    >
      {/* Results Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm relative z-[10001]">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900">Generated Logos</h2>
            <p className="text-neutral-600 text-sm">Click on a logo to select it, then choose to improve or download it</p>
          </div>
          <div className="flex items-center gap-2 lg:gap-2 pr-14 lg:pr-0">
            {isImprovementMode && onExitImprovementMode && (
              <button
                onClick={onExitImprovementMode}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                title="Back to Original Logos"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={onReset}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
              title="Start New Logo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 p-4 lg:p-8 lg:min-h-0 relative z-10 overflow-y-auto bg-transparent">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center min-h-96 space-y-6 py-8">
            {isGenerating && (
              <>
                <div className="w-10 h-10 animate-spin mt-4">
                  <img 
                    src="/images/AI-Logo-Generator-Logo.png" 
                    alt="AI Logo Builder" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-neutral-900 text-lg font-medium">Generating your logos...</p>
                  <p className="text-neutral-600 text-sm mt-2">GPT Image 1.5 is generating images</p>
                  <p className="text-neutral-400 text-xs mt-1">This can take up to a minute</p>
                </div>
              </>
            )}
            
            {/* GPT Image 1.5's Thoughts Display */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 w-full max-w-2xl mt-4 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-primary-600 text-sm font-semibold">
                  {streamedThoughts ? 'GPT Image 1.5 is thinking...' : 'Waiting for GPT Image 1.5\'s thoughts...'}
                </span>
                {isGenerating && <div className="ml-2 w-2 h-4 bg-primary-500 animate-pulse rounded"></div>}
                {!isGenerating && streamedThoughts && (
                  <svg className="ml-2 w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div 
                ref={thoughtsContainerRef}
                className="h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500/50 scrollbar-track-neutral-100 rounded-lg bg-neutral-50/50"
              >
                <div className="text-neutral-700 text-sm font-normal leading-relaxed whitespace-pre-wrap p-4">
                  {streamedThoughts || (isGenerating ? '🎨 GPT Image 1.5 is analyzing your request...\n📝 Generating detailed design reasoning...\n🔍 Preparing professional logo concepts...\n⚡ Processing with AI...' : '')}
                  {streamedThoughts && isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1 rounded"></span>
                  )}
                </div>
                {/* Fade gradient at top to create smooth transition */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-neutral-50 via-neutral-50/80 to-transparent pointer-events-none z-10"></div>
                {/* Scroll hint when user has scrolled up */}
                {userHasScrolledUp && isGenerating && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-primary-700 bg-white px-3 py-1.5 rounded-full border border-primary-500/30 pointer-events-none z-10 animate-pulse shadow-md">
                    ↓ Auto-scroll paused - scroll to bottom to resume
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : generatedImages.length > 0 || (isImprovementMode && selectedLogoUrl) ? (
          <div className="flex justify-center items-center w-full min-h-96">
            {isImprovementMode && selectedLogoUrl ? (
              // Show the improved logo if available, otherwise show the original logo being improved
              <div className={`flex flex-col items-center ${mobileCompactMode ? 'space-y-2' : 'space-y-6'}`}>
                {!mobileCompactMode && (
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-medium text-neutral-900 mb-2">
                      {generatedImages.length > 0 ? "Improved Logo" : "Logo to Improve"}
                    </h4>
                    <p className="text-neutral-600 text-sm">
                      {generatedImages.length > 0 
                        ? "Here's your improved logo!" 
                        : "Describe how you'd like to improve this logo"
                      }
                    </p>
                  </div>
                )}
                <div 
                  className={`${mobileCompactMode ? 'w-32 h-32' : 'w-64 h-64 lg:w-80 lg:h-80'} bg-white border-2 border-neutral-200 rounded-xl ${mobileCompactMode ? 'p-4' : 'p-8 lg:p-12'} hover:border-primary-300 transition-all duration-200 flex flex-col items-center justify-center group shadow-lg hover:shadow-xl cursor-pointer`}
                  onClick={() => {
                    const imageUrl = generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl;
                    setExpandedImageUrl(imageUrl);
                    setShowExpandedImage(true);
                  }}
                >
                  <img
                    src={generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl}
                    alt={generatedImages.length > 0 ? "Improved logo" : "Logo to improve"}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                
                {/* Action Buttons for Improvement Mode */}
                <div className={`flex gap-2 ${mobileCompactMode ? 'w-32' : 'w-full'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const logoToSave = generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl;
                      openSaveModal(logoToSave);
                    }}
                    disabled={savingLogoId === (generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl)}
                    className={`flex-1 bg-green-500 hover:bg-green-600 text-white ${mobileCompactMode ? 'py-1 px-2' : 'py-2 px-3'} rounded-lg ${mobileCompactMode ? 'text-xs' : 'text-xs'} font-medium transition-colors border border-green-600 hover:border-green-700 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
                    title="Save to Library"
                  >
                    {savingLogoId === (generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl) ? (
                      <div className={`${mobileCompactMode ? 'w-2 h-2' : 'w-3 h-3'} border border-white border-t-transparent rounded-full animate-spin`}></div>
                    ) : (
                      <svg className={`${mobileCompactMode ? 'w-2 h-2' : 'w-3 h-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    {!mobileCompactMode && 'Save'}
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const logoToDownload = generatedImages.length > 0 ? generatedImages[0] : selectedLogoUrl;
                      handleDownload(logoToDownload);
                    }}
                    className={`flex-1 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white ${mobileCompactMode ? 'py-1 px-2' : 'py-2 px-3'} rounded-lg font-semibold hover:scale-105 transition-all duration-300 ${mobileCompactMode ? 'text-xs' : 'text-xs'} flex items-center justify-center gap-1 shadow-md hover:shadow-lg`}
                    title="Download PNG"
                  >
                    <svg className={`${mobileCompactMode ? 'w-2 h-2' : 'w-3 h-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!mobileCompactMode && 'PNG'}
                  </button>
                </div>
                
                {!mobileCompactMode && (
                  <div className="text-center">
                    <p className="text-neutral-600 text-sm">Use the chat panel on the left to describe your improvements</p>
                  </div>
                )}
              </div>
            ) : (
              // Show all generated logos in grid - click to select, then show actions
              <div className="w-full">
                <div className="inline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
                  {generatedImages.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedLogoIndex(selectedLogoIndex === index ? null : index)}
                      className={`aspect-square bg-white border-2 rounded-xl p-4 lg:p-6 transition-all duration-200 flex flex-col items-center justify-center hover:scale-105 relative shadow-lg hover:shadow-xl cursor-pointer ${
                        selectedLogoIndex === index 
                          ? 'border-primary-500 ring-4 ring-primary-200' 
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Generated logo ${index + 1}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                      />
                      {selectedLogoIndex === index && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1.5 shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons - Only show when a logo is selected */}
                {selectedLogoIndex !== null && generatedImages[selectedLogoIndex] && (
                  <div className="flex flex-col items-center space-y-4 mt-6">
                    <div className="text-center mb-2">
                      <p className="text-neutral-600 text-sm font-medium">Logo {selectedLogoIndex + 1} selected</p>
                    </div>
                    <div className="flex gap-3 w-full max-w-md">
                      <button
                        onClick={() => onImproveLogo(generatedImages[selectedLogoIndex])}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        title="Improve Logo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Improve
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSaveModal(generatedImages[selectedLogoIndex]);
                        }}
                        disabled={savingLogoId === generatedImages[selectedLogoIndex]}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors border border-green-600 hover:border-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        title="Save to Library"
                      >
                        {savingLogoId === generatedImages[selectedLogoIndex] ? (
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        Save
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(generatedImages[selectedLogoIndex]);
                        }}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        title="Download PNG"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedLogoIndex === null && (
                  <div className="text-center mt-6">
                    <p className="text-neutral-500 text-sm">Click on a logo above to improve or download it</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Ready to create amazing logos</h3>
              <p className="text-neutral-600">Describe your logo idea in the chat to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {generatedImages.length > 0 && (
        <div 
          data-walkthrough="action-buttons"
          className="p-4 lg:p-6 border-t border-neutral-200 space-y-3 bg-gradient-to-t from-blue-50 to-transparent backdrop-blur-sm relative z-30"
        >
          {isImprovementMode ? null : (
            <button
              onClick={onRegenerate}
              className="w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Generate Different Variations
            </button>
          )}
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h3 className="text-lg font-semibold text-neutral-900">SVG Code</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-neutral-400 text-sm">SVG Code</span>
                <button
                  onClick={() => navigator.clipboard.writeText(selectedLogoCode)}
                  className="bg-primary-500/20 hover:bg-primary-500/30 text-primary-700 px-3 py-1 rounded text-xs font-medium transition-colors border border-primary-500/30"
                >
                  Copy Code
                </button>
              </div>
              <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                <code>{selectedLogoCode}</code>
              </pre>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-neutral-600 text-sm">
                Copy this SVG code to use your logo in any web project or design tool.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {showExpandedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowExpandedImage(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowExpandedImage(false)}
              className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2 z-10"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={expandedImageUrl}
              alt="Expanded logo view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Save to Library Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Save to Library</h3>
            <p className="text-neutral-600 mb-4">Give your logo a name to save it to your library.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const logoName = formData.get('logoName') as string;
              if (logoName.trim()) {
                handleSaveToLibrary(logoToSave, logoName.trim());
              }
            }}>
              <input
                type="text"
                name="logoName"
                placeholder="Enter logo name..."
                className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                autoFocus
                required
              />
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLogoId !== null}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {savingLogoId ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

