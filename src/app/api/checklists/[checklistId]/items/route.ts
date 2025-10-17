import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createChecklistItem } from '@/lib/services/checklistService';
import { checklistErrorResponse, resolveRequestClient } from '@/app/api/checklists/_utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    checklistId: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { checklistId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { content?: string } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!payload.content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  try {
    const item = await createChecklistItem(client, checklistId, payload.content);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to create checklist item');
  }
}
