'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult
} from '@hello-pangea/dnd';
import {
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Checklist, ChecklistItem } from '@/lib/services/checklistService';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ChecklistModalProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPendingCountChange?: (count: number) => void;
}

type RequestOptions = RequestInit & { fallbackMessage: string };

function mergeHeaders(
  base: HeadersInit | undefined,
  extra: HeadersInit
): HeadersInit {
  if (!base) {
    return extra;
  }

  const headers = new Headers(base);
  new Headers(extra).forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
}

export function ChecklistModal({
  tripId,
  open,
  onOpenChange,
  onPendingCountChange
}: ChecklistModalProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const selectedChecklist = useMemo(
    () => checklists.find((checklist) => checklist.id === selectedChecklistId) ?? null,
    [checklists, selectedChecklistId]
  );

  const pendingCount = useMemo(() => {
    return checklists.reduce(
      (accumulator, checklist) =>
        accumulator + checklist.items.filter((item) => !item.isChecked).length,
      0
    );
  }, [checklists]);

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // Ignore errors and fall back to unauthenticated requests
    }
    return {};
  }, []);

  const request = useCallback(
    async (input: RequestInfo, options: RequestOptions) => {
      const { fallbackMessage, headers, ...rest } = options;
      const authHeaders = await getAuthHeaders();
      const response = await fetch(input, {
        credentials: 'include',
        headers: mergeHeaders(headers, {
          'Content-Type': 'application/json',
          ...authHeaders
        }),
        ...rest
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data?.error ?? fallbackMessage;
        throw new Error(message);
      }

      return data;
    },
    [getAuthHeaders]
  );

  const fetchChecklists = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`/api/trips/${tripId}/checklists`, window.location.origin);
        if (initialLoadComplete) {
          url.searchParams.set('ensureDefaults', 'false');
        }

        const data = await request(url.toString(), {
          method: 'GET',
          signal,
          fallbackMessage: 'Unable to load checklists'
        });

        const fetched: Checklist[] = data?.checklists ?? [];

        setChecklists(fetched);
        setSelectedChecklistId((current) => {
          if (current && fetched.some((checklist) => checklist.id === current)) {
            return current;
          }

          const personal = fetched.find((checklist) => checklist.type === 'personal');
          return personal?.id ?? (fetched[0]?.id ?? null);
        });

        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      } catch (fetchError: any) {
        if (fetchError?.name === 'AbortError') {
          return;
        }
        setError(fetchError?.message ?? 'Unable to load checklists');
      } finally {
        setLoading(false);
      }
    },
    [request, tripId]
  );

  useEffect(() => {
    if (!open) {
      setEditingItemId(null);
      setEditingValue('');
      setError(null);
      return;
    }

    const controller = new AbortController();
    void fetchChecklists(controller.signal);

    return () => {
      controller.abort();
    };
  }, [open, fetchChecklists]);

  const handleDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setTimeout(() => {
          setNewItemContent('');
          setEditingItemId(null);
          setEditingValue('');
          setError(null);
        }, 150);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleSelectChecklist = useCallback((value: string) => {
    setSelectedChecklistId(value);
    setEditingItemId(null);
    setEditingValue('');
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!selectedChecklistId) {
      return;
    }

    const trimmed = newItemContent.trim();
    if (!trimmed) {
      setError('Please enter an item before adding it.');
      return;
    }

    setIsAddingItem(true);
    setError(null);

    try {
      const data = await request(
        `/api/checklists/${selectedChecklistId}/items`,
        {
          method: 'POST',
          body: JSON.stringify({ content: trimmed }),
          fallbackMessage: 'Unable to add checklist item'
        }
      );

      const created: ChecklistItem = data.item;

      setChecklists((previous) =>
        previous.map((checklist) =>
          checklist.id === selectedChecklistId
            ? {
                ...checklist,
                items: [...checklist.items, created].sort(
                  (a, b) => a.itemOrder - b.itemOrder
                )
              }
            : checklist
        )
      );
      setNewItemContent('');
    } catch (addError: any) {
      setError(addError?.message ?? 'Unable to add checklist item');
    } finally {
      setIsAddingItem(false);
    }
  }, [newItemContent, request, selectedChecklistId]);

  const handleInputKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleAddItem();
      }
    },
    [handleAddItem]
  );

  const updateItemInState = useCallback(
    (checklistId: string, item: ChecklistItem) => {
      setChecklists((previous) =>
        previous.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: checklist.items.map((existing) =>
                  existing.id === item.id ? item : existing
                )
              }
            : checklist
        )
      );
    },
    []
  );

  const removeItemFromState = useCallback((checklistId: string, itemId: string) => {
    setChecklists((previous) =>
      previous.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.filter((item) => item.id !== itemId)
            }
          : checklist
      )
    );
  }, []);

  const handleToggleItem = useCallback(
    async (checklistId: string, item: ChecklistItem) => {
      const nextState = !item.isChecked;
      const optimisticItem: ChecklistItem = { ...item, isChecked: nextState };
      updateItemInState(checklistId, optimisticItem);
      setError(null);

      try {
        const data = await request(`/api/checklist-items/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isChecked: nextState }),
          fallbackMessage: 'Unable to update checklist item'
        });

        const updated: ChecklistItem = data.item;
        updateItemInState(checklistId, updated);
      } catch (toggleError: any) {
        updateItemInState(checklistId, item);
        setError(toggleError?.message ?? 'Unable to update checklist item');
      }
    },
    [request, updateItemInState]
  );

  const handleDeleteItem = useCallback(
    async (checklistId: string, item: ChecklistItem) => {
      const previousItems =
        checklists.find((checklist) => checklist.id === checklistId)?.items ?? [];

      removeItemFromState(checklistId, item.id);
      setError(null);

      try {
        await request(`/api/checklist-items/${item.id}`, {
          method: 'DELETE',
          fallbackMessage: 'Unable to delete checklist item'
        });
      } catch (deleteError: any) {
        setChecklists((previous) =>
          previous.map((checklist) =>
            checklist.id === checklistId
              ? { ...checklist, items: previousItems }
              : checklist
          )
        );
        setError(deleteError?.message ?? 'Unable to delete checklist item');
      }
    },
    [checklists, removeItemFromState, request]
  );

  const beginEdit = useCallback((item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingValue(item.content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditingValue('');
  }, []);

  const handleEditChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEditingValue(event.target.value);
  }, []);

  const saveEdit = useCallback(
    async (checklistId: string, item: ChecklistItem) => {
      const trimmed = editingValue.trim();
      if (!trimmed) {
        setError('Item content cannot be empty');
        return;
      }

      setError(null);

      try {
        const data = await request(`/api/checklist-items/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ content: trimmed }),
          fallbackMessage: 'Unable to update checklist item'
        });

        const updated: ChecklistItem = data.item;
        updateItemInState(checklistId, updated);
        setEditingItemId(null);
        setEditingValue('');
      } catch (editError: any) {
        setError(editError?.message ?? 'Unable to update checklist item');
      }
    },
    [editingValue, request, updateItemInState]
  );

  const handleReorder = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !selectedChecklistId) {
        return;
      }

      const currentChecklist = checklists.find(
        (checklist) => checklist.id === selectedChecklistId
      );

      if (!currentChecklist) {
        return;
      }

      const { index: sourceIndex } = result.source;
      const { index: destinationIndex } = result.destination;

      if (sourceIndex === destinationIndex) {
        return;
      }

      const reordered = [...currentChecklist.items];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, moved);

      setChecklists((previous) =>
        previous.map((checklist) =>
          checklist.id === selectedChecklistId
            ? { ...checklist, items: reordered }
            : checklist
        )
      );

      setError(null);

      try {
        const data = await request('/api/checklist-items/reorder', {
          method: 'PUT',
          body: JSON.stringify({
            checklistId: selectedChecklistId,
            orderedItemIds: reordered.map((item) => item.id)
          }),
          fallbackMessage: 'Unable to reorder checklist items'
        });

        const updatedItems: ChecklistItem[] = data.items ?? reordered;
        setChecklists((previous) =>
          previous.map((checklist) =>
            checklist.id === selectedChecklistId
              ? { ...checklist, items: updatedItems }
              : checklist
          )
        );
      } catch (reorderError: any) {
        setChecklists((previous) =>
          previous.map((checklist) =>
            checklist.id === selectedChecklistId
              ? { ...checklist, items: currentChecklist.items }
              : checklist
          )
        );
        setError(reorderError?.message ?? 'Unable to reorder checklist items');
      }
    },
    [checklists, request, selectedChecklistId]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChecklists();
    setRefreshing(false);
  }, [fetchChecklists]);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl w-full p-0 text-emerald-50 sm:rounded-[28px] [&>button.absolute.right-3.top-3]:hidden">
        <div className="relative max-h-[90vh] overflow-hidden rounded-[inherit] border border-emerald-200/35 bg-gradient-to-br from-emerald-400/18 via-slate-900/84 to-black/82 shadow-[0_45px_120px_-35px_rgba(16,185,129,0.65)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,255,204,0.26),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.26),transparent_55%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="px-6 pt-5 pb-4 space-y-4">
              <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl font-semibold text-emerald-50">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  Trip Checklist
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/70">
                Organize personal tasks and group responsibilities for your trip.
              </DialogDescription>
              </DialogHeader>

              <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRefresh()}
                  disabled={loading || refreshing}
                  className="gap-2 rounded-full border border-emerald-200/30 bg-emerald-400/10 text-emerald-100 shadow-[0_20px_60px_-45px_rgba(20,184,166,0.7)] transition hover:bg-emerald-400/20 hover:text-emerald-50"
                >
                  <RefreshCcw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <DialogClose className="group rounded-full border border-emerald-200/30 bg-emerald-400/10 p-2 text-emerald-100 shadow-[0_20px_60px_-45px_rgba(248,113,113,0.7)] transition hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/20 px-4 py-3 text-sm text-destructive shadow-[0_25px_70px_-45px_rgba(248,113,113,0.85)]">
                {error}
              </div>
            )}
          </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-emerald-100/80">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-200" />
              </div>
            ) : !selectedChecklist ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-emerald-100/70">
                <p>No checklist available yet.</p>
                <p>Try refreshing or adding a new item to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <Tabs value={selectedChecklistId ?? undefined} onValueChange={handleSelectChecklist}>
                  <TabsList className="grid w-full grid-cols-2 gap-3 rounded-2xl border border-emerald-200/30 bg-slate-950/50 p-3 backdrop-blur-xl shadow-[0_4px_24px_-8px_rgba(16,185,129,0.3)] h-auto">
                    {checklists.map((checklist) => {
                      const unchecked = checklist.items.filter((item) => !item.isChecked).length;
                      const isPersonal = checklist.type === 'personal';
                      const palette = isPersonal
                        ? {
                            // Personal Checklist - Emerald/Teal theme
                            baseText: 'text-emerald-100/70',
                            activeText: 'data-[state=active]:text-emerald-50',
                            baseBorder: 'border-emerald-200/20',
                            activeBorder: 'data-[state=active]:border-emerald-400/60',
                            hoverBorder: 'hover:border-emerald-300/40',
                            baseGradient: 'from-slate-900/40 to-slate-950/60',
                            activeGradient: 'data-[state=active]:from-emerald-500/25 data-[state=active]:via-teal-500/20 data-[state=active]:to-emerald-600/25',
                            badge: 'bg-emerald-400/85 text-emerald-950',
                            activeBadge: 'data-[state=active]:bg-emerald-300 data-[state=active]:text-emerald-950 data-[state=active]:ring-emerald-400/50',
                            shadow: 'shadow-emerald-500/0',
                            activeShadow: 'data-[state=active]:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4),0_8px_16px_-8px_rgba(16,185,129,0.6)]',
                            hoverShadow: 'hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.3)]',
                            glow: 'data-[state=active]:ring-2 data-[state=active]:ring-emerald-400/30'
                          }
                        : {
                            // Group Checklist - Cyan/Sky theme
                            baseText: 'text-cyan-100/70',
                            activeText: 'data-[state=active]:text-cyan-50',
                            baseBorder: 'border-cyan-200/20',
                            activeBorder: 'data-[state=active]:border-cyan-400/60',
                            hoverBorder: 'hover:border-cyan-300/40',
                            baseGradient: 'from-slate-900/40 to-slate-950/60',
                            activeGradient: 'data-[state=active]:from-cyan-500/25 data-[state=active]:via-sky-500/20 data-[state=active]:to-cyan-600/25',
                            badge: 'bg-cyan-400/85 text-cyan-950',
                            activeBadge: 'data-[state=active]:bg-cyan-300 data-[state=active]:text-cyan-950 data-[state=active]:ring-cyan-400/50',
                            shadow: 'shadow-cyan-500/0',
                            activeShadow: 'data-[state=active]:shadow-[0_0_20px_-4px_rgba(6,182,212,0.4),0_8px_16px_-8px_rgba(6,182,212,0.6)]',
                            hoverShadow: 'hover:shadow-[0_4px_12px_-4px_rgba(6,182,212,0.3)]',
                            glow: 'data-[state=active]:ring-2 data-[state=active]:ring-cyan-400/30'
                          };

                      return (
                        <TabsTrigger
                          key={checklist.id}
                          value={checklist.id}
                          className={cn(
                            // Base layout & structure
                            'group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border px-5 py-4 min-h-[64px] transition-all duration-300 ease-out',
                            // Typography
                            'text-sm font-bold uppercase tracking-wider',
                            // Background gradient
                            'bg-gradient-to-br',
                            palette.baseGradient,
                            palette.activeGradient,
                            // Border states
                            palette.baseBorder,
                            palette.activeBorder,
                            palette.hoverBorder,
                            // Text colors
                            palette.baseText,
                            palette.activeText,
                            // Shadow & glow effects
                            palette.shadow,
                            palette.activeShadow,
                            palette.hoverShadow,
                            palette.glow,
                            // Hover effects
                            'hover:scale-[1.01]',
                            // Active state
                            'data-[state=active]:scale-[1.02]',
                            // Focus states
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/50',
                            // Backdrop
                            'backdrop-blur-sm'
                          )}
                        >
                          {/* Shine effect on active */}
                          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-300 group-data-[state=active]:opacity-100" />

                          {/* Content */}
                          <span className="relative flex items-center gap-2">
                            <span className="truncate drop-shadow-sm">{checklist.name}</span>
                            {unchecked > 0 && (
                              <span className={cn(
                                'inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-extrabold shadow-sm ring-1 ring-white/15 transition-all duration-300',
                                palette.badge,
                                palette.activeBadge
                              )}>
                                {unchecked}
                              </span>
                            )}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {checklists.map((checklist) => {
                    const isPersonal = checklist.type === 'personal';
                    const cardPalette = isPersonal
                      ? 'border-emerald-200/35 from-emerald-400/22 via-slate-900/65 to-emerald-500/18 shadow-[0_30px_70px_-45px_rgba(16,185,129,0.75)]'
                      : 'border-cyan-200/30 from-cyan-400/22 via-slate-900/60 to-cyan-500/18 shadow-[0_30px_70px_-45px_rgba(14,165,233,0.6)]';
                    const listPalette = isPersonal
                      ? 'border-emerald-200/35 from-slate-950/35 via-slate-900/45 to-emerald-500/18'
                      : 'border-cyan-200/30 from-slate-950/35 via-slate-900/45 to-cyan-500/18';
                    const checkboxPalette = isPersonal
                      ? 'border-emerald-300/60 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-emerald-950'
                      : 'border-cyan-300/60 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-cyan-950';

                    return (
                      <TabsContent key={checklist.id} value={checklist.id} className="space-y-4">
                      <div className={cn(
                          'rounded-2xl bg-gradient-to-r p-4 backdrop-blur-lg',
                          cardPalette
                        )}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Input
                            value={newItemContent}
                            onChange={(event) => setNewItemContent(event.target.value)}
                            onKeyDown={handleInputKeyPress}
                            placeholder="Add a new checklist item..."
                            disabled={isAddingItem}
                            className="flex-1 rounded-xl border border-emerald-200/40 bg-slate-950/60 text-emerald-50 placeholder:text-emerald-100/60"
                          />
                          <Button
                            type="button"
                            onClick={() => void handleAddItem()}
                            disabled={isAddingItem}
                            className="gap-2 rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-400/45 via-emerald-500/40 to-teal-500/45 text-emerald-950 shadow-[0_20px_60px_-40px_rgba(16,185,129,0.85)] hover:scale-105 hover:text-emerald-900"
                          >
                            {isAddingItem ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className={cn(
                          'max-h-80 overflow-y-auto rounded-2xl border bg-gradient-to-br p-2 backdrop-blur-lg',
                          listPalette
                        )}>
                        {checklist.items.length === 0 ? (
                          <div className="flex h-32 items-center justify-center text-sm text-emerald-100/70">
                            No items yet. Add something above to get started.
                          </div>
                        ) : (
                          <DragDropContext onDragEnd={handleReorder}>
                            <Droppable droppableId={`droppable-${checklist.id}`}>
                              {(droppableProvided) => (
                                <div
                                  ref={droppableProvided.innerRef}
                                  {...droppableProvided.droppableProps}
                                  className="space-y-2"
                                >
                                  {checklist.items.map((item, index) => {
                                    const isEditing = editingItemId === item.id;
                                    return (
                                      <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(draggableProvided, snapshot) => (
                                          <div
                                            ref={draggableProvided.innerRef}
                                            {...draggableProvided.draggableProps}
                                            className={cn(
                                              'flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/20 bg-gradient-to-r from-slate-950/35 via-slate-900/25 to-emerald-500/15 p-3 transition-all backdrop-blur-md',
                                              snapshot.isDragging && 'shadow-[0_25px_70px_-45px_rgba(20,184,166,0.8)] ring-2 ring-emerald-300/40'
                                            )}
                                          >
                                            <div className="flex flex-1 items-start gap-3">
                                              <button
                                                type="button"
                                                {...draggableProvided.dragHandleProps}
                                                className="mt-1 rounded-md border border-transparent p-1 text-emerald-100/70 transition hover:border-emerald-300/50 hover:text-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                                                aria-label="Drag to reorder"
                                              >
                                                <GripVertical className="h-4 w-4" />
                                              </button>

                                              <Checkbox
                                                checked={item.isChecked}
                                                onCheckedChange={() => void handleToggleItem(checklist.id, item)}
                                                className={cn('mt-1', checkboxPalette)}
                                              />

                                              <div className="flex flex-1 flex-col">
                                                {isEditing ? (
                                                  <div className="flex items-center gap-2">
                                                    <Input
                                                      value={editingValue}
                                                      onChange={handleEditChange}
                                                      onKeyDown={(event) => {
                                                        if (event.key === 'Enter') {
                                                          event.preventDefault();
                                                          void saveEdit(checklist.id, item);
                                                        } else if (event.key === 'Escape') {
                                                          event.preventDefault();
                                                          cancelEdit();
                                                        }
                                                      }}
                                                      autoFocus
                                                      className="rounded-lg border border-emerald-200/40 bg-emerald-500/10 text-emerald-50"
                                                    />
                                                  </div>
                                                ) : (
                                                  <p
                                                    className={cn(
                                                      'text-sm leading-tight text-emerald-50 drop-shadow-sm',
                                                      item.isChecked && 'text-emerald-200/60 line-through'
                                                    )}
                                                  >
                                                    {item.content}
                                                  </p>
                                                )}
                                                <span className="mt-1 text-xs text-emerald-100/60">
                                                  Updated {new Date(item.updatedAt).toLocaleString()}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              {isEditing ? (
                                                <>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-emerald-100/90 hover:text-emerald-50"
                                                    onClick={() => void saveEdit(checklist.id, item)}
                                                    aria-label="Save changes"
                                                  >
                                                    <Save className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={cancelEdit}
                                                    aria-label="Cancel edit"
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </>
                                              ) : (
                                                <>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-emerald-100/80 hover:text-emerald-50"
                                                    onClick={() => beginEdit(item)}
                                                    aria-label="Edit item"
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => void handleDeleteItem(checklist.id, item)}
                                                    aria-label="Delete item"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {droppableProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        )}
                      </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
