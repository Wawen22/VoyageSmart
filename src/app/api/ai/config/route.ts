import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const hasEndpoint = !!process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
    const hasApiVersion = !!process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION;
    const hasDeploymentName = !!process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME;

    return NextResponse.json({
      success: true,
      config: {
        hasApiKey,
        hasEndpoint,
        hasApiVersion,
        hasDeploymentName,
        isAzureConfig: hasApiKey && hasEndpoint,
        endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || null,
        apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
        deploymentName: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano',
        model: 'gpt-5-nano',
        fullUrl: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT ?
          `${process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano'}` :
          null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get AI configuration',
        message: error.message
      },
      { status: 500 }
    );
  }
}
