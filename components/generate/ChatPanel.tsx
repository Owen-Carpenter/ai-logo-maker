'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isImprovement?: boolean;
}

interface ChatPanelProps {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  isGenerating: boolean;
  generatedImages: string[];
  onGenerate: (prompt: string, style: string, color: string) => void;
  isImprovementMode?: boolean;
  selectedIconUrl?: string;
  onExitImprovementMode?: () => void;
  hasUserTakenAction?: boolean;
  conversationHistory?: ChatMessage[];
  resetConversation?: boolean; // New prop to trigger conversation reset
  mobileCompactMode?: boolean; // New prop for mobile compact mode
  streamedThoughts?: string; // Streaming thoughts during generation
}

export default function ChatPanel({ 
  currentPrompt, 
  setCurrentPrompt, 
  isGenerating, 
  generatedImages, 
  onGenerate,
  isImprovementMode = false,
  selectedIconUrl,
  onExitImprovementMode,
  hasUserTakenAction = true,
  conversationHistory = [],
  resetConversation = false,
  mobileCompactMode = false,
  streamedThoughts = ''
}: ChatPanelProps) {
  const [style, setStyle] = useState('modern');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Reset conversation when resetConversation prop changes
  useEffect(() => {
    if (resetConversation) {
      setCurrentPrompt('');
      // Note: We can't directly reset conversationHistory here since it's controlled by parent
      // The parent component should handle clearing the conversation history
    }
  }, [resetConversation, setCurrentPrompt]);

  // Helper function to format logo title
  const formatLogoTitle = (prompt: string) => {
    if (!prompt.trim()) return 'Logo Assistant';
    const words = prompt.trim().split(' ');
    if (words.length <= 3) return prompt.trim();
    return words.slice(0, 3).join(' ') + '...';
  };

  // Helper function to clean message content (remove credit counts)
  const cleanMessageContent = (content: string) => {
    // Remove credit count patterns like "68!" or "69!" at the end
    return content.replace(/\s+\d+!?\s*$/, '').trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPrompt.trim()) {
      onGenerate(currentPrompt, style, '#FF6C00'); // Default color, users can describe colors in prompt
    }
  };



  return (
      <div 
        data-walkthrough="chat-panel"
        className="w-full lg:w-96 lg:flex-shrink-0 bg-white backdrop-blur-sm flex flex-col border-r-0 lg:border-r border-b-0 lg:border-b-0 border-neutral-200 h-full lg:h-full lg:min-h-0"
      >
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-white backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900">
              Logo Assistant
            </h2>
            <p className="text-neutral-600 text-sm">
              {isImprovementMode ? 'Describe how to improve this logo' : 'Powered by GPT Image 1.5'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent relative bg-neutral-50/30">
        {/* Scroll indicator - subtle fade at top */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        
        {/* Initial assistant message */}
        {conversationHistory.length === 0 && !isGenerating && (
          <div className="flex justify-start items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[85%]">
              <p className="text-neutral-900 text-sm leading-relaxed">
                {isImprovementMode 
                  ? 'I can see the logo you want to improve! Describe what changes you\'d like me to make.'
                  : 'Hi! I\'m your AI Logo Assistant. Describe the logo you\'d like me to create, and I\'ll generate multiple professional variations for you.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Show selected logo in improvement mode - hide in mobile compact mode */}
        {isImprovementMode && selectedIconUrl && conversationHistory.length === 0 && !mobileCompactMode && !isGenerating && (
          <div className="flex justify-start items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
              <p className="text-neutral-900 text-xs mb-2 font-medium">Selected logo to improve:</p>
              <img 
                src={selectedIconUrl} 
                alt="Logo to improve" 
                className="w-16 h-16 object-contain bg-neutral-50 rounded-lg"
              />
            </div>
          </div>
        )}
        
        {/* Conversation History */}
        {conversationHistory.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.type === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div className={`rounded-2xl p-4 shadow-sm max-w-[85%] ${
              message.type === 'user' 
                ? 'bg-gradient-to-r from-primary-600 to-accent-500 rounded-tr-sm' 
                : 'bg-white border border-neutral-200 rounded-tl-sm'
            }`}>
              <p className={`text-sm leading-relaxed ${
                message.type === 'user' 
                  ? 'text-white' 
                  : 'text-neutral-900'
              }`}>
                {cleanMessageContent(message.content)}
              </p>
              {message.isImprovement && message.type === 'user' && (
                <span className="text-xs text-white/80 ml-2 font-light">(improvement)</span>
              )}
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Current prompt being typed - only show if not empty and not already in history */}
        {currentPrompt.trim() && !conversationHistory.some(msg => msg.content.includes(currentPrompt.trim())) && !isGenerating && (
          <div className="flex justify-end items-start gap-3">
            <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-[85%]">
              <p className="text-white text-sm">{currentPrompt}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Generating indicator with streaming thoughts */}
        {isGenerating && (
          <div className="flex justify-start items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[85%]">
              {streamedThoughts ? (
                <div className="text-neutral-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {streamedThoughts}
                  <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse"></span>
                </div>
              ) : (
                <>
                  <p className="text-neutral-900 text-sm mb-2">
                    {isImprovementMode ? 'Improving your logo...' : 'Creating your logos...'}
                  </p>
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Scroll indicator - subtle fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-200 bg-white backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          {/* Message Input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                data-walkthrough="prompt-input"
                type="text"
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                placeholder={
                  !hasUserTakenAction && generatedImages.length > 0 && !isImprovementMode 
                    ? "Choose an action for your logos first..." 
                    : isImprovementMode 
                      ? "Describe how to improve this logo..." 
                      : "Describe your logo idea..."
                }
                className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-3 pr-12 text-neutral-900 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition-all disabled:opacity-50 shadow-sm"
                disabled={isGenerating || (!hasUserTakenAction && generatedImages.length > 0 && !isImprovementMode)}
                maxLength={200}
              />
              {currentPrompt.length > 150 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  {200 - currentPrompt.length}
                </span>
              )}
            </div>
            <button
              data-walkthrough="generate-button"
              type="submit"
              disabled={!currentPrompt.trim() || isGenerating || (!hasUserTakenAction && generatedImages.length > 0 && !isImprovementMode)}
              className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg disabled:hover:shadow-md min-w-[48px]"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}