import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteChecklist, updateChecklist } from '@/lib/services/checklistService';
import { checklistErrorResponse, resolveRequestClient } from '@/app/api/checklists/_utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    checklistId: string;
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { checklistId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { name?: string } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const checklist = await updateChecklist(client, checklistId, payload);
    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to update checklist');
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { checklistId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteChecklist(client, checklistId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to delete checklist');
  }
}
