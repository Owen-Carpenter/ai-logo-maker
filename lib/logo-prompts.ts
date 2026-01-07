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
  
  // Optimized prompt - shorter to reduce token costs while maintaining quality
  return `Create ${count} professional logos for "${prompt}" in ${style} style.

Requirements: transparent PNG background, memorable design, scalable, brand-ready.

Briefly explain:
1. Design approach for "${prompt}"
2. Transparent background method
3. Memorable/distinctive elements
4. Scalability considerations
5. Color/typography for ${style} style

Keep concise.`;
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
    : 'Choose appropriate colors for the brand identity';
  const colorImportance = hasColorRequest
    ? 'IMPORTANT: The color change must be visually obvious and match exactly what was requested.'
    : '';
  
  // Optimized prompt - shorter to reduce token costs
  return `Refine existing logo with feedback: "${prompt}" in ${style} style.

Requirements: transparent PNG, maintain brand identity, scalable, brand-ready.

Briefly explain:
1. Refinement approach for: "${allImprovements}"
2. Transparent background method
3. Brand identity preservation - ${colorNote}
4. Scalability after changes
5. Keeping core concept while applying all modifications

Refine existing logo, don't create new. Apply all changes together. ${colorImportance}`;
}

/**
 * Generate system prompt for logo design reasoning
 */
export function getSystemPrompt(): string {
  // Optimized system prompt - shorter to reduce token costs
  return "Expert logo designer creating professional, brand-ready logos with transparent PNG backgrounds. Focus on memorable, scalable designs for business use.";
}

/**
 * Generate image generation prompt for initial logos
 */
export function getInitialImagePrompt(context: PromptContext, variationIndex: number): string {
  const { prompt, style } = context;
  const variation = variationIndex === 0 ? "first" : variationIndex === 1 ? "second" : "third";
  
  return `Professional ${prompt} logo, ${style} style, ${variation} version. TRANSPARENT PNG BACKGROUND. Brand-ready design, memorable and distinctive, scalable composition, clean edges, high contrast, suitable for business use.`;
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
      return `Refine the existing ${basePrompt} logo with ALL these cumulative changes: ${allImprovements}. Keep the same core brand identity and recognizable elements, but apply ALL the requested modifications together. TRANSPARENT PNG BACKGROUND. Brand-ready design, memorable and distinctive, scalable composition, clean edges, high contrast, suitable for business use.`;
    } else {
      // For other improvements, modify the existing logo with all cumulative changes
      return `Refine the existing ${basePrompt} logo with ALL these cumulative changes: ${allImprovements}. Keep the same core brand concept and recognizable elements, but apply ALL the requested changes together: ${allImprovements}. TRANSPARENT PNG BACKGROUND. Brand-ready design, memorable and distinctive, scalable composition, clean edges, high contrast, suitable for business use.`;
    }
  } else {
    // Fallback for general improvements
    return `Refine the existing ${basePrompt} logo with improvements. Keep the same core brand concept. TRANSPARENT PNG BACKGROUND. Brand-ready design, memorable and distinctive, scalable composition, clean edges, high contrast, suitable for business use.`;
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


