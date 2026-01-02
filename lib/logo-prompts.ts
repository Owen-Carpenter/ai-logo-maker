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
  
  return `You are an expert logo designer using GPT Image 1.5. A user wants to create ${count} professional, brand-ready logos for "${prompt}" in ${style} style.

CRITICAL REQUIREMENTS:
- TRANSPARENT PNG BACKGROUND - completely transparent, no background elements
- PROFESSIONAL DESIGN - memorable, scalable, and distinctive brand identity
- CLEAN COMPOSITION - well-balanced elements that work at various sizes
- BRAND-READY - suitable for business use, marketing materials, and digital applications
- HIGH CONTRAST - clear visibility at small and large sizes
- STYLE CONSISTENCY - all variations should maintain the ${style} aesthetic

Please provide a brief reasoning process explaining:
1. How you'll create a professional, brand-ready logo for "${prompt}"
2. Your approach to ensuring completely transparent backgrounds
3. Design choices that make it memorable and distinctive
4. How you'll ensure scalability and versatility across different applications
5. Color and typography considerations for the ${style} style

Keep this concise and focused on creating a professional brand identity.`;
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
  
  return `You are an expert logo designer using GPT Image 1.5. A user wants to refine an existing logo based on their cumulative feedback: "${prompt}" in ${style} style.

CRITICAL REQUIREMENTS:
- TRANSPARENT PNG BACKGROUND - completely transparent, no background elements
- PROFESSIONAL DESIGN - maintain brand identity while applying improvements
- CLEAN COMPOSITION - well-balanced elements that work at various sizes
- BRAND-READY - suitable for business use, marketing materials, and digital applications
- HIGH CONTRAST - clear visibility at small and large sizes
- STYLE CONSISTENCY - maintain the ${style} aesthetic

Please provide a brief reasoning process explaining:
1. How you'll refine the existing logo based on ALL the feedback: "${allImprovements}"
2. Your approach to ensuring completely transparent backgrounds
3. Design choices that maintain brand identity while applying improvements - ${colorNote}
4. How you'll ensure the logo remains scalable and versatile after the changes
5. How you'll keep the same core brand concept and recognizable elements while applying ALL the requested modifications together

IMPORTANT: You are REFINING an existing logo with CUMULATIVE improvements, not creating a new one. Keep the same core brand concept and recognizable elements, but apply ALL the requested modifications together (color, style adjustments, composition, etc.). ${colorImportance}`;
}

/**
 * Generate system prompt for logo design reasoning
 */
export function getSystemPrompt(): string {
  return "You are an expert logo designer specializing in professional, brand-ready logos with transparent PNG backgrounds. You create memorable, scalable logos that work for businesses, brands, and digital applications. Focus on distinctive designs, clear composition, and versatile brand identities that maintain clarity at all sizes.";
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


