import type { SupabaseClient } from '@supabase/supabase-js';

const CHECKLIST_TABLE = 'checklists';
const CHECKLIST_ITEMS_TABLE = 'checklist_items';

export type ChecklistType = 'personal' | 'group';

export interface ChecklistItem {
  id: string;
  checklistId: string;
  content: string;
  isChecked: boolean;
  itemOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  tripId: string;
  ownerId: string | null;
  name: string;
  type: ChecklistType;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
}

interface ChecklistRow {
  id: string;
  trip_id: string;
  owner_id: string | null;
  name: string;
  type: ChecklistType;
  created_at: string;
  updated_at: string;
  checklist_items?: ChecklistItemRow[];
}

interface ChecklistItemRow {
  id: string;
  checklist_id: string;
  content: string;
  is_checked: boolean;
  item_order: number;
  created_at: string;
  updated_at: string;
}

export class ChecklistServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function mapChecklistItem(row: ChecklistItemRow): ChecklistItem {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    content: row.content,
    isChecked: row.is_checked,
    itemOrder: row.item_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapChecklist(row: ChecklistRow): Checklist {
  return {
    id: row.id,
    tripId: row.trip_id,
    ownerId: row.owner_id,
    name: row.name,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.checklist_items ?? [])
      .map(mapChecklistItem)
      .sort((a, b) => a.itemOrder - b.itemOrder)
  };
}

async function ensureTripAccessible(
  client: SupabaseClient,
  tripId: string
): Promise<void> {
  const { data, error } = await client
    .from<{ id: string }>('trips')
    .select('id')
    .eq('id', tripId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ChecklistServiceError('Trip not found', 404);
  }
}

async function createChecklistIfMissing(
  client: SupabaseClient,
  tripId: string,
  type: ChecklistType,
  ownerId: string | null,
  name: string
): Promise<void> {
  const { data, error } = await client
    .from<ChecklistRow>(CHECKLIST_TABLE)
    .select('id')
    .eq('trip_id', tripId)
    .eq('type', type)
    .maybeSingle();

  if (error) {
    // Permission errors should surface to caller
    throw error;
  }

  const typeRequiresOwner = type === 'personal';

  if (!data) {
    const payload: Record<string, any> = {
      trip_id: tripId,
      type,
      name
    };

    if (typeRequiresOwner) {
      payload.owner_id = ownerId;
    }

    try {
      await client.from(CHECKLIST_TABLE).insert(payload);
    } catch (insertError: any) {
      // Swallow unique violations to handle race conditions gracefully
      if (insertError?.code !== '23505') {
        throw insertError;
      }
    }
  }
}

export async function ensureDefaultChecklists(
  client: SupabaseClient,
  tripId: string,
  userId: string
): Promise<void> {
  await ensureTripAccessible(client, tripId);

  await createChecklistIfMissing(client, tripId, 'personal', userId, 'Personal Checklist');
  await createChecklistIfMissing(client, tripId, 'group', null, 'Group Checklist');
}

export async function listChecklists(
  client: SupabaseClient,
  tripId: string,
  userId: string
): Promise<Checklist[]> {
  await ensureDefaultChecklists(client, tripId, userId);

  const { data, error } = await client
    .from<ChecklistRow>(CHECKLIST_TABLE)
    .select(
      `
        id,
        trip_id,
        owner_id,
        name,
        type,
        created_at,
        updated_at,
        checklist_items (
          id,
          checklist_id,
          content,
          is_checked,
          item_order,
          created_at,
          updated_at
        )
      `
    )
    .eq('trip_id', tripId)
    .order('type', { ascending: true })
    .order('item_order', { ascending: true, foreignTable: CHECKLIST_ITEMS_TABLE });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // RLS limits access; filter personal checklists to owner
  return data
    .filter((row) => {
      if (row.type === 'personal') {
        return row.owner_id === userId;
      }
      return true;
    })
    .map(mapChecklist);
}

export async function createChecklist(
  client: SupabaseClient,
  tripId: string,
  userId: string,
  params: { name?: string; type: ChecklistType }
): Promise<Checklist> {
  if (params.type !== 'personal' && params.type !== 'group') {
    throw new ChecklistServiceError('Invalid checklist type', 400);
  }

  await ensureTripAccessible(client, tripId);

  const payload: Record<string, any> = {
    trip_id: tripId,
    name: params.name?.trim() || (params.type === 'personal' ? 'Personal Checklist' : 'Group Checklist'),
    type: params.type
  };

  if (params.type === 'personal') {
    payload.owner_id = userId;
  }

  const { data, error } = await client
    .from<ChecklistRow>(CHECKLIST_TABLE)
    .insert(payload)
    .select(
      `
        id,
        trip_id,
        owner_id,
        name,
        type,
        created_at,
        updated_at,
        checklist_items (
          id,
          checklist_id,
          content,
          is_checked,
          item_order,
          created_at,
          updated_at
        )
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return mapChecklist(data);
}

export async function updateChecklist(
  client: SupabaseClient,
  checklistId: string,
  updates: { name?: string }
): Promise<Checklist> {
  if (updates.name && updates.name.trim().length === 0) {
    throw new ChecklistServiceError('Checklist name cannot be empty', 400);
  }

  const payload: Record<string, any> = {};

  if (typeof updates.name === 'string') {
    payload.name = updates.name.trim();
  }

  if (Object.keys(payload).length === 0) {
    throw new ChecklistServiceError('No valid fields to update', 400);
  }

  const { data, error } = await client
    .from<ChecklistRow>(CHECKLIST_TABLE)
    .update(payload)
    .eq('id', checklistId)
    .select(
      `
        id,
        trip_id,
        owner_id,
        name,
        type,
        created_at,
        updated_at,
        checklist_items (
          id,
          checklist_id,
          content,
          is_checked,
          item_order,
          created_at,
          updated_at
        )
      `
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ChecklistServiceError('Checklist not found', 404);
  }

  return mapChecklist(data);
}

export async function deleteChecklist(
  client: SupabaseClient,
  checklistId: string
): Promise<void> {
  const { error } = await client.from(CHECKLIST_TABLE).delete().eq('id', checklistId);
  if (error) {
    throw error;
  }
}

export async function createChecklistItem(
  client: SupabaseClient,
  checklistId: string,
  content: string
): Promise<ChecklistItem> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ChecklistServiceError('Item content cannot be empty', 400);
  }

  // Determine next order position
  const { data: lastItem, error: orderError } = await client
    .from<Pick<ChecklistItemRow, 'item_order'>>(CHECKLIST_ITEMS_TABLE)
    .select('item_order')
    .eq('checklist_id', checklistId)
    .order('item_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  const nextOrder = typeof lastItem?.item_order === 'number' ? lastItem.item_order + 1 : 0;

  const { data, error } = await client
    .from<ChecklistItemRow>(CHECKLIST_ITEMS_TABLE)
    .insert({
      checklist_id: checklistId,
      content: trimmed,
      item_order: nextOrder
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapChecklistItem(data);
}

export async function updateChecklistItem(
  client: SupabaseClient,
  itemId: string,
  updates: { content?: string; isChecked?: boolean }
): Promise<ChecklistItem> {
  const payload: Partial<ChecklistItemRow> = {};

  if (typeof updates.content === 'string') {
    const trimmed = updates.content.trim();
    if (!trimmed) {
      throw new ChecklistServiceError('Item content cannot be empty', 400);
    }
    payload.content = trimmed;
  }

  if (typeof updates.isChecked === 'boolean') {
    payload.is_checked = updates.isChecked;
  }

  if (Object.keys(payload).length === 0) {
    throw new ChecklistServiceError('No valid fields to update', 400);
  }

  const { data, error } = await client
    .from<ChecklistItemRow>(CHECKLIST_ITEMS_TABLE)
    .update(payload)
    .eq('id', itemId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ChecklistServiceError('Checklist item not found', 404);
  }

  return mapChecklistItem(data);
}

export async function deleteChecklistItem(
  client: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await client.from(CHECKLIST_ITEMS_TABLE).delete().eq('id', itemId);
  if (error) {
    throw error;
  }
}

export async function reorderChecklistItems(
  client: SupabaseClient,
  checklistId: string,
  orderedItemIds: string[]
): Promise<ChecklistItem[]> {
  if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
    throw new ChecklistServiceError('orderedItemIds must be a non-empty array', 400);
  }

  const { data: existingItems, error: existingError } = await client
    .from<ChecklistItemRow>(CHECKLIST_ITEMS_TABLE)
    .select('id')
    .eq('checklist_id', checklistId);

  if (existingError) {
    throw existingError;
  }

  if (!existingItems || existingItems.length === 0) {
    throw new ChecklistServiceError('Checklist has no items to reorder', 400);
  }

  const existingIds = new Set(existingItems.map((item) => item.id));

  if (existingIds.size !== orderedItemIds.length) {
    throw new ChecklistServiceError('orderedItemIds must include every item exactly once', 400);
  }

  for (const id of orderedItemIds) {
    if (!existingIds.has(id)) {
      throw new ChecklistServiceError('orderedItemIds contains an unknown item id', 400);
    }
  }

  // Update each item sequentially to preserve order deterministically
  for (let index = 0; index < orderedItemIds.length; index += 1) {
    const id = orderedItemIds[index];
    const { error } = await client
      .from(CHECKLIST_ITEMS_TABLE)
      .update({ item_order: index })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  const { data: updatedItems, error: fetchError } = await client
    .from<ChecklistItemRow>(CHECKLIST_ITEMS_TABLE)
    .select('*')
    .eq('checklist_id', checklistId)
    .order('item_order', { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  if (!updatedItems) {
    return [];
  }

  return updatedItems.map(mapChecklistItem);
}
