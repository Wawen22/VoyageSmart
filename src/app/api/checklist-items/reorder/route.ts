import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { reorderChecklistItems } from '@/lib/services/checklistService';
import { checklistErrorResponse, resolveRequestClient } from '@/app/api/checklists/_utils';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { checklistId?: string; orderedItemIds?: string[] } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!payload.checklistId) {
    return NextResponse.json({ error: 'checklistId is required' }, { status: 400 });
  }

  if (!Array.isArray(payload.orderedItemIds)) {
    return NextResponse.json({ error: 'orderedItemIds must be an array' }, { status: 400 });
  }

  try {
    const items = await reorderChecklistItems(
      client,
      payload.checklistId,
      payload.orderedItemIds
    );
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to reorder checklist items');
  }
}
