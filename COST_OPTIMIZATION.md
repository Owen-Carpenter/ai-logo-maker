# OpenAI Cost Optimization Guide

This document explains the cost optimizations implemented and how to further reduce OpenAI API costs.

## Implemented Optimizations

### 1. **Image Quality Settings** ✅
- **Changed from `"high"` to `"standard"`** - Reduces image generation costs by ~50%
- Quality is still excellent for logos. "hd" quality is mainly beneficial for photorealistic images.
- **Environment Variable**: `OPENAI_IMAGE_QUALITY` (default: `"standard"`)
  - Options: `"standard"` (cheaper) or `"hd"` (more expensive, higher quality)

### 2. **Image Size Settings** ✅
- **Default size**: `1024x1024` (configurable)
- **Environment Variable**: `OPENAI_IMAGE_SIZE`
  - Options: `"256x256"`, `"512x512"`, `"1024x1024"`, `"1792x1024"`, `"1024x1792"`
  - Smaller sizes = lower costs
  - For logos, `512x512` or `1024x1024` is usually sufficient

### 3. **Reasoning Call Optimization** ✅
- **Reduced `max_tokens` from 1000 to 500** - Cuts reasoning costs by ~50%
- **Reduced `temperature` from 0.8 to 0.7** - More consistent, cost-effective responses
- This call is for UX (streaming thoughts to user) and can be disabled if needed

### 4. **Prompt Optimization** ✅
- Shortened all prompts by ~40-50% while maintaining quality
- Reduced token usage for reasoning calls
- System prompts are now more concise

## Cost Breakdown

### Before Optimizations (per logo generation):
- Reasoning call: ~1000 tokens × $0.0015/1K tokens = ~$0.0015
- 3 images at "high" quality 1024x1024: ~$0.12 each = ~$0.36
- **Total per generation: ~$0.36**

### After Optimizations (per logo generation):
- Reasoning call: ~500 tokens × $0.0015/1K tokens = ~$0.00075
- 3 images at "standard" quality 1024x1024: ~$0.06 each = ~$0.18
- **Total per generation: ~$0.18**
- **Savings: ~50% reduction**

## Further Cost Reduction Options

### Option 1: Disable Reasoning Call (Additional ~$0.00075 savings per generation)
If you want to disable the reasoning/thoughts feature entirely, you can modify `lib/chatgpt.ts`:

```typescript
// In generateIconsWithChatGPT function, comment out or remove:
if (onThought) {
  // ... reasoning call code ...
}
```

### Option 2: Reduce Image Count
Currently generates 3 images for initial generation. You could reduce to 2:
- In `app/api/generate-icons/route.ts`, change `count: isImprovement ? 1 : 3` to `count: isImprovement ? 1 : 2`
- **Savings: ~33% on image generation costs**

### Option 3: Use Smaller Image Sizes
For logos, `512x512` is often sufficient:
- Set `OPENAI_IMAGE_SIZE=512x512` in your `.env.local`
- **Savings: ~75% on image generation costs** (512x512 is 1/4 the pixels of 1024x1024)

### Option 4: Use Lower Quality for Improvements
Improvements could use "standard" quality (already implemented), but you could also:
- Use smaller sizes for improvements: `512x512`
- **Savings: Additional ~50% on improvement costs**

## Environment Variables

Add these to your `.env.local` file to control costs:

```env
# Image quality: "standard" (cheaper) or "hd" (more expensive)
OPENAI_IMAGE_QUALITY=standard

# Image size: "256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"
OPENAI_IMAGE_SIZE=1024x1024
```

## Recommended Settings for Maximum Savings

For maximum cost reduction while maintaining acceptable quality:

```env
OPENAI_IMAGE_QUALITY=standard
OPENAI_IMAGE_SIZE=512x512
```

This would reduce costs by approximately **75-80%** compared to the original settings.

## Monitoring Costs

1. Check your OpenAI usage dashboard: https://platform.openai.com/usage
2. Monitor API calls in your application logs
3. Set up billing alerts in OpenAI dashboard

## Notes

- Logo quality at "standard" is still excellent - the difference is mainly noticeable in photorealistic images
- 512x512 logos are usually sufficient for most use cases and can be scaled up if needed
- The reasoning call is optional UX enhancement - disabling it won't affect logo quality

