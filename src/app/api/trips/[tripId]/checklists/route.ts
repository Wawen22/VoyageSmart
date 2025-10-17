import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createChecklist, listChecklists, type ChecklistType } from '@/lib/services/checklistService';
import { checklistErrorResponse, resolveRequestClient } from '@/app/api/checklists/_utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    tripId: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { tripId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const checklists = await listChecklists(client, tripId, userId);
    return NextResponse.json({ success: true, checklists });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to load checklists');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { tripId } = context.params;
  const { client, userId } = await resolveRequestClient(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { name?: string; type?: ChecklistType } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!payload.type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }

  try {
    const checklist = await createChecklist(client, tripId, userId, {
      type: payload.type,
      name: payload.name
    });
    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    return checklistErrorResponse(error, 'Failed to create checklist');
  }
}
