import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteChecklistItem, updateChecklistItem } from '@/lib/services/checklistService';
import { checklistErrorResponse, resolveRequestClient } from '@/app/api/checklists/_utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    itemId: string;
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { itemId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { content?: string; isChecked?: boolean } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const item = await updateChecklistItem(client, itemId, payload);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to update checklist item');
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { itemId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteChecklistItem(client, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to delete checklist item');
  }
}
