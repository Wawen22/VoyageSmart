import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { MapPinIcon, ClockIcon, DollarSignIcon, FileIcon, TrashIcon, EditIcon, MoveIcon, EyeIcon, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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

type ActivityItemProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMove?: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (activityId: string, isSelected: boolean) => void;
};

export default function ActivityItem({
  activity,
  onEdit,
  onDelete,
  onMove,
  onViewDetails,
  isSelectable = false,
  isSelected = false,
  onSelectChange
}: ActivityItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
      default:
        return 'Low';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 3:
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getPriorityBorderColor = (priority: number) => {
    switch (priority) {
      case 1:
        return '#ef4444'; // red-500
      case 2:
        return '#f97316'; // orange-500
      case 3:
      default:
        return '#3b82f6'; // blue-500
    }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(activity.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-4 group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1 activity-item-mobile w-full max-w-full ${isSelected ? 'bg-blue-500/10 ring-2 ring-blue-500/30' : ''}`}>
      {/* Modern Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

      {/* Priority Border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: getPriorityBorderColor(activity.priority) }}
      ></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start gap-3">
          {isSelectable && (
            <div className="pt-1 flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectChange?.(activity.id, checked === true)}
                aria-label={`Select ${activity.name}`}
                className="border-white/30"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-blue-500 transition-colors duration-300 truncate">{activity.name}</h3>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {activity.start_time && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 border border-blue-500/30">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatTime(activity.start_time)}
                  {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                </div>
              )}

              {activity.location && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-600 border border-purple-500/30">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[120px]">{activity.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
              {getPriorityLabel(activity.priority)}
            </span>
          </div>
      </div>

        {activity.notes && (
          <div className="mt-3 p-3 rounded-xl bg-background/30 border border-white/10">
            <p className="text-xs text-muted-foreground line-clamp-2">{activity.notes}</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-2">
            {activity.cost && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 border border-green-500/30">
                <DollarSignIcon className="h-3 w-3 mr-1" />
                {formatCurrency(activity.cost, activity.currency)}
              </div>
            )}
            {activity.booking_reference && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-600 border border-orange-500/30">
                <FileIcon className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[80px]">{activity.booking_reference}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(activity)}
                className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 transition-all duration-300 hover:scale-110"
                aria-label="View details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => onEdit(activity)}
              className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 transition-all duration-300 hover:scale-110"
              aria-label="Edit activity"
            >
              <EditIcon className="h-4 w-4" />
            </button>

            {onMove && (
              <button
                onClick={() => onMove(activity)}
                className="p-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-600 transition-all duration-300 hover:scale-110"
                aria-label="Move activity"
              >
                <MoveIcon className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={handleDeleteClick}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                confirmDelete
                  ? 'bg-red-500/30 text-red-600 animate-pulse'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-600'
              }`}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete activity'}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
