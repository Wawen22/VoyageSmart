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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        const data = await request(`/api/trips/${tripId}/checklists`, {
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
      <DialogContent className="max-w-3xl w-full bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold">
            <span>Trip Checklist</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={loading || refreshing}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCcw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Organize personal tasks and group responsibilities for your trip.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedChecklist ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>No checklist available yet.</p>
            <p>Try refreshing or adding a new item to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={selectedChecklistId ?? undefined} onValueChange={handleSelectChecklist}>
              <TabsList>
                {checklists.map((checklist) => {
                  const unchecked = checklist.items.filter((item) => !item.isChecked).length;
                  return (
                    <TabsTrigger key={checklist.id} value={checklist.id} className="gap-2">
                      <span>{checklist.name}</span>
                      {unchecked > 0 && (
                        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-semibold text-primary">
                          {unchecked}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {checklists.map((checklist) => (
                <TabsContent key={checklist.id} value={checklist.id} className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-background/60 p-4 shadow-inner">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Input
                        value={newItemContent}
                        onChange={(event) => setNewItemContent(event.target.value)}
                        onKeyDown={handleInputKeyPress}
                        placeholder="Add a new checklist item..."
                        disabled={isAddingItem}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => void handleAddItem()}
                        disabled={isAddingItem}
                        className="gap-2"
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

                  <div className="max-h-80 overflow-y-auto rounded-xl border border-border/40 bg-background/40 p-2">
                    {checklist.items.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
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
                                          'flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 transition-all',
                                          snapshot.isDragging && 'shadow-lg ring-2 ring-primary/40'
                                        )}
                                      >
                                        <div className="flex flex-1 items-start gap-3">
                                          <button
                                            type="button"
                                            {...draggableProvided.dragHandleProps}
                                            className="mt-1 rounded-md border border-transparent p-1 text-muted-foreground hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            aria-label="Drag to reorder"
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </button>

                                          <Checkbox
                                            checked={item.isChecked}
                                            onCheckedChange={() => void handleToggleItem(checklist.id, item)}
                                            className="mt-1"
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
                                                />
                                              </div>
                                            ) : (
                                              <p
                                                className={cn(
                                                  'text-sm leading-tight',
                                                  item.isChecked && 'text-muted-foreground line-through'
                                                )}
                                              >
                                                {item.content}
                                              </p>
                                            )}
                                            <span className="mt-1 text-xs text-muted-foreground">
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
                                                className="h-8 w-8"
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
                                                className="h-8 w-8"
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
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
