/**
 * Logo Generation Prompts
 * 
 * Centralized prompt templates for initial logo generation and improvements
 */

export interface PromptContext {
  prompt: string;
  style: string;
  count: number;
  improvementInstruction?: string;
  basePrompt?: string;
}

/**
 * Generate reasoning prompt for initial logo creation
 */
export function getInitialReasoningPrompt(context: PromptContext): string {
  const { prompt, style, count } = context;
  
  return `You are an expert logo designer using GPT Image 1. A user wants to create ${count} professional-grade logos for "${prompt}" in ${style} style.

CRITICAL REQUIREMENTS:
- PROFESSIONAL LOGO DESIGN - create a complete, polished logo suitable for business use
- TRANSPARENT PNG BACKGROUND - completely transparent, no background elements
- SCALABLE DESIGN - works well at both large and small sizes
- BRAND-READY - professional quality suitable for company branding
- VISUALLY STRIKING - memorable and distinctive design

Please provide a brief reasoning process explaining:
1. How you'll create a professional logo for "${prompt}"
2. Your approach to ensuring the logo is brand-ready and scalable
3. Design choices that make it memorable and professional
4. How you'll ensure it works across different applications

Keep this concise and focused on professional logo design principles.`;
}

/**
 * Generate reasoning prompt for logo improvement
 */
export function getImprovementReasoningPrompt(context: PromptContext): string {
  const { prompt, style, improvementInstruction = 'general improvement', basePrompt = prompt } = context;
  
  // Extract all improvements from the full prompt if it contains cumulative changes
  const allImprovements = prompt.includes(', and ') 
    ? prompt.split(', ').slice(1).join(', ') // Remove base prompt, keep all improvements
    : improvementInstruction;
  
  const hasColorRequest = /blue|color|red|green|yellow|orange|purple|pink|black|white/i.test(allImprovements);
  const colorNote = hasColorRequest 
    ? 'CRITICAL: You MUST use the specific color requested in the feedback' 
    : 'Choose appropriate colors for the design';
  const colorImportance = hasColorRequest
    ? 'IMPORTANT: The color change must be visually obvious and match exactly what was requested.'
    : '';
  
  return `You are an expert logo designer using GPT Image 1. A user wants to refine an existing logo based on their cumulative feedback: "${prompt}" in ${style} style.

CRITICAL REQUIREMENTS:
- PROFESSIONAL LOGO DESIGN - maintain professional quality throughout improvements
- TRANSPARENT PNG BACKGROUND - completely transparent, no background elements
- SCALABLE DESIGN - ensure improvements maintain scalability
- BRAND-READY - keep the logo suitable for business use

Please provide a brief reasoning process explaining:
1. How you'll refine the existing logo based on ALL the feedback: "${allImprovements}"
2. Your approach to maintaining professional quality while applying changes
3. Color choices and design adjustments - ${colorNote}
4. How you'll preserve the core brand identity while applying ALL the requested modifications cumulatively

IMPORTANT: You are REFINING an existing logo with CUMULATIVE improvements, not creating a new one. Keep the same core brand concept and recognizable identity, but apply ALL the requested modifications together (color, style adjustments, etc.). ${colorImportance}`;
}

/**
 * Generate system prompt for logo design reasoning
 */
export function getSystemPrompt(): string {
  return "You are an expert logo designer specializing in professional-grade logos with transparent PNG backgrounds. You create memorable, brand-ready logos suitable for business use. Focus on creating distinctive, scalable designs that work well across different applications and sizes.";
}

/**
 * Generate image generation prompt for initial logos
 */
export function getInitialImagePrompt(context: PromptContext, variationIndex: number): string {
  const { prompt, style } = context;
  const variation = variationIndex === 0 ? "first" : variationIndex === 1 ? "second" : "third";
  
  return `Professional ${prompt} logo, ${style} style, ${variation} version. TRANSPARENT PNG BACKGROUND. Brand-ready design, scalable, memorable, distinctive. Clean design suitable for business use.`;
}

/**
 * Generate image generation prompt for logo improvements
 */
export function getImprovementImagePrompt(context: PromptContext): string {
  const { prompt, improvementInstruction = '', basePrompt = prompt } = context;
  
  // Extract all improvements from the full prompt if it contains cumulative changes
  const allImprovements = prompt.includes(', and ') 
    ? prompt.split(', ').slice(1).join(', ') // Remove base prompt, keep all improvements
    : improvementInstruction;
  
  // Check if this is a color change request in any of the improvements
  const isColorChange = /blue|color|red|green|yellow|orange|purple|pink|black|white/i.test(allImprovements);
  
  if (allImprovements) {
    if (isColorChange) {
      // For color changes, modify the existing logo with all cumulative changes
      return `Refine the existing ${basePrompt} logo with ALL these cumulative changes: ${allImprovements}. Keep the same basic brand identity and structure, but apply ALL the requested modifications together. TRANSPARENT PNG BACKGROUND. Professional design, scalable, brand-ready.`;
    } else {
      // For other improvements, modify the existing logo with all cumulative changes
      return `Refine the existing ${basePrompt} logo with ALL these cumulative changes: ${allImprovements}. Keep the same core brand concept and recognizable identity, but apply ALL the requested changes together: ${allImprovements}. TRANSPARENT PNG BACKGROUND. Professional design, scalable, brand-ready.`;
    }
  } else {
    // Fallback for general improvements
    return `Refine the existing ${basePrompt} logo with improvements. Keep the same core brand concept. TRANSPARENT PNG BACKGROUND. Professional design, scalable, brand-ready.`;
  }
}

/**
 * Extract improvement instruction from a combined prompt
 */
export function extractImprovementParts(prompt: string): { basePrompt: string; improvementInstruction: string } {
  if (!prompt.includes(',')) {
    return { basePrompt: prompt, improvementInstruction: '' };
  }
  
  const parts = prompt.split(',');
  const basePrompt = parts[0].trim();
  const improvementInstruction = parts.slice(1).join(',').trim();
  
  return { basePrompt, improvementInstruction };
}

