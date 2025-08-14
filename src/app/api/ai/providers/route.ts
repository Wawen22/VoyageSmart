import { NextRequest, NextResponse } from 'next/server';
import { aiProviderService } from '@/lib/services/aiProviderService';

/**
 * GET /api/ai/providers
 * Returns the list of available AI providers
 */
export async function GET(request: NextRequest) {
  try {
    // Get available providers from the service
    const availableProviders = aiProviderService.getAvailableProviders();
    
    // Get current default provider from environment
    const defaultProvider = process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER || 'gemini';
    
    return NextResponse.json({
      success: true,
      providers: availableProviders,
      defaultProvider,
      total: availableProviders.length
    });
  } catch (error: any) {
    console.error('Error getting AI providers:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get AI providers',
        details: error.message
      },
      { status: 500 }
    );
  }
}
