import { NextRequest, NextResponse } from 'next/server';
import { aiProviderService, AIProvider } from '@/lib/services/aiProviderService';
import { logger } from '@/lib/logger';

// Force dynamic rendering - do not pre-render this route during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let provider: string | undefined;

  try {
    const body = await request.json();
    provider = body.provider;

    // Validate provider
    if (!provider || !['gemini', 'openai', 'deepseek', 'gemini-openrouter'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    logger.debug('Testing AI provider', { provider });

    // Test the provider
    const isAvailable = await aiProviderService.testProvider(provider as AIProvider);

    logger.info('AI provider test completed', {
      provider,
      isAvailable
    });

    return NextResponse.json({
      success: isAvailable,
      provider,
      message: isAvailable 
        ? `${provider} is available and working`
        : `${provider} is not available or not working`
    });
  } catch (error: any) {
    logger.error('Failed to test AI provider', {
      error: error.message,
      provider
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test provider',
        message: error.message
      },
      { status: 500 }
    );
  }
}
