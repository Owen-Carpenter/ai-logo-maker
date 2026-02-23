import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { prompt, style, isImprovement } = body


    // Validate required fields
    if (!prompt || !style) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, style' },
        { status: 400 }
      )
    }

    // Initial logo generation costs 3 credits, improvements cost 1 credit each
    const creditsNeeded = isImprovement ? 1 : 3

    // use_tokens() handles everything: checks balance, deducts bonus first then subscription,
    // records usage, and returns updated balances atomically.
    const { data: usageResult, error: usageError } = await supabase
      .rpc('use_tokens', {
        p_user_id: user.id,
        p_tokens_needed: creditsNeeded,
        p_usage_type: isImprovement ? 'logo_improvement' : 'logo_generation',
        p_prompt_text: prompt.trim(),
        p_style_selected: style
      })

    if (usageError) {
      console.error('Error in use_tokens:', usageError)
      return NextResponse.json(
        { error: 'Failed to process credit deduction' },
        { status: 500 }
      )
    }

    const tokenUsage = usageResult?.[0]

    if (!tokenUsage?.success) {
      return NextResponse.json(
        {
          error: tokenUsage?.error_message || 'Insufficient credits',
          remaining_tokens: tokenUsage?.remaining_tokens || 0,
          subscription_credits_remaining: tokenUsage?.subscription_credits_remaining || 0,
          bonus_credits_remaining: tokenUsage?.bonus_credits_remaining || 0
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      remaining_tokens: tokenUsage.remaining_tokens,
      subscription_credits_remaining: tokenUsage.subscription_credits_remaining,
      bonus_credits_remaining: tokenUsage.bonus_credits_remaining,
      usage_id: tokenUsage.usage_id,
      credits_deducted: creditsNeeded,
      message: `${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''} deducted. ${tokenUsage.remaining_tokens} remaining.`
    })

  } catch (error) {
    console.error('Credit deduction API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
