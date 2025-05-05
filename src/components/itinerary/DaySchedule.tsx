import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import ActivityItem from './ActivityItem';
import { ChevronDownIcon, ChevronUpIcon, CalendarIcon, PlusIcon, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Activity = {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
};

type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
};

type DayScheduleProps = {
  day: ItineraryDay;
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onDeleteMultipleActivities?: (activityIds: string[]) => void;
  onDeleteAllActivities?: (dayId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
  onViewActivityDetails?: (activity: Activity) => void;
};

export default function DaySchedule({
  day,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onDeleteMultipleActivities,
  onDeleteAllActivities,
  onMoveActivity,
  onViewActivityDetails
}: DayScheduleProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Reset selection when day changes or collapses
  useEffect(() => {
    setSelectedActivities([]);
    setSelectionMode(false);
  }, [day.id, isCollapsed]);

  const handleSelectActivity = (activityId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedActivities(prev => [...prev, activityId]);
    } else {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    }
  };

  const handleSelectAll = () => {
    if (!day.activities) return;

    if (selectedActivities.length === day.activities.length) {
      // Deselect all
      setSelectedActivities([]);
    } else {
      // Select all
      setSelectedActivities(day.activities.map(activity => activity.id));
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedActivities([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedActivities.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = () => {
    if (onDeleteMultipleActivities && selectedActivities.length > 0) {
      onDeleteMultipleActivities(selectedActivities);
      setSelectedActivities([]);
      setSelectionMode(false);
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteAll = () => {
    if (!day.activities || day.activities.length === 0) return;
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = () => {
    if (onDeleteAllActivities) {
      onDeleteAllActivities(day.id);
      setSelectedActivities([]);
      setSelectionMode(false);
    }
    setShowDeleteAllConfirm(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="bg-card shadow rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors animate-fade-in">
      <div
        className="px-3 py-3 sm:px-6 sm:py-4 flex justify-between items-center bg-muted/30 cursor-pointer"
        onClick={toggleCollapse}
      >
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            {formatDate(day.day_date)}
          </h2>
        </div>

        <div className="flex items-center space-x-1">
          <div className="text-xs bg-muted px-2 py-1 rounded-full hidden sm:block">
            {day.activities?.length || 0} attività
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            aria-label={isCollapsed ? "Espandi" : "Comprimi"}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-3 py-3 sm:px-6 sm:py-4 border-t border-border animate-slide-in-top">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              {day.notes && (
                <div className="mb-3 bg-muted/20 p-2 rounded-md animate-fade-in">
                  <p className="text-xs sm:text-sm text-muted-foreground">{day.notes}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 ml-2">
              {!selectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onEditDay(day)}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden xs:inline">Modifica</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onAddActivity(day.id)}
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden xs:inline">Attività</span>
                  </Button>

                  {day.activities && day.activities.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={toggleSelectionMode}
                      >
                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Seleziona</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleDeleteAll}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Elimina tutte</span>
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant={selectedActivities.length === (day.activities?.length || 0) ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleSelectAll}
                  >
                    {selectedActivities.length === (day.activities?.length || 0) ? (
                      <>
                        <Square className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden xs:inline">Deseleziona tutte</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden xs:inline">Seleziona tutte</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleDeleteSelected}
                    disabled={selectedActivities.length === 0}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden xs:inline">Elimina {selectedActivities.length}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={toggleSelectionMode}
                  >
                    <span className="hidden xs:inline">Annulla</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {day.activities && day.activities.length > 0 ? (
            <div className="space-y-3">
              {day.activities
                .sort((a, b) => {
                  if (!a.start_time && !b.start_time) return 0;
                  if (!a.start_time) return 1;
                  if (!b.start_time) return -1;
                  return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                })
                .map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onMove={onMoveActivity}
                  onViewDetails={onViewActivityDetails}
                  isSelectable={selectionMode}
                  isSelected={selectedActivities.includes(activity.id)}
                  onSelectChange={handleSelectActivity}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-muted/10 rounded-md">
              <p className="text-muted-foreground text-sm">Nessuna attività pianificata per questo giorno.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => onAddActivity(day.id)}
                className="mt-1 h-8 text-xs"
              >
                Aggiungi un'attività
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog di conferma per eliminazione multipla */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare {selectedActivities.length} attività.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog di conferma per eliminazione di tutte le attività */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina tutte le attività</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare tutte le attività di questo giorno ({day.activities?.length || 0} attività).
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina tutte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}