import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  EyeIcon,
  EditIcon,
  MoveIcon,
  TrashIcon,
  CheckCircleIcon,
  UtensilsIcon,
  LandmarkIcon,
  CarIcon,
  PlaneIcon,
  BedIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

type ActivityCardProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMove?: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (activityId: string, isSelected: boolean) => void;
};

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onMove,
  onViewDetails,
  isSelectable = false,
  isSelected = false,
  onSelectChange
}: ActivityCardProps) {
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

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(activity.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const getPriorityDotColor = () => {
    switch (activity.priority) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3:
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = () => {
    const type = activity.type?.toLowerCase();
    switch (type) {
      case 'food':
      case 'restaurant':
        return UtensilsIcon;
      case 'culture':
      case 'activity':
      case 'sightseeing':
        return LandmarkIcon;
      case 'transport':
      case 'car':
      case 'train':
      case 'bus':
        return CarIcon;
      case 'flight':
      case 'plane':
        return PlaneIcon;
      case 'accommodation':
      case 'hotel':
      case 'lodging':
        return BedIcon;
      default:
        return MapPinIcon;
    }
  };

  const getCategoryColor = () => {
    const type = activity.type?.toLowerCase();
    switch (type) {
      case 'food':
      case 'restaurant':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'culture':
      case 'activity':
      case 'sightseeing':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'transport':
      case 'car':
      case 'train':
      case 'bus':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'flight':
      case 'plane':
        return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
      case 'accommodation':
      case 'hotel':
      case 'lodging':
        return 'text-teal-500 bg-teal-500/10 border-teal-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const CategoryIcon = getCategoryIcon();
  const priorityDotColor = getPriorityDotColor();
  const categoryColor = getCategoryColor();

  return (
    <div
      className={`
        relative flex items-start gap-3 py-2 px-3
        glass-card rounded-xl
        border border-white/10
        hover:border-white/20 hover:shadow-md
        transition-all duration-200
        ${activity.status === 'completed' ? 'opacity-60' : ''}
      `}
    >
      {/* Priority Indicator Dot */}
      <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${priorityDotColor} shadow-lg`} />

      {/* Selection Checkbox */}
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => 
            onSelectChange?.(activity.id, checked as boolean)
          }
          className="flex-shrink-0 mt-0.5"
        />
      )}

      {/* Category Icon - Prominent Timeline Style */}
      <div className={`
        p-2 rounded-full border-2
        ${categoryColor}
        flex-shrink-0 shadow-sm
      `}>
        <CategoryIcon className="h-4 w-4" />
      </div>

      {/* Content - Ultra Compact */}
      <div className="flex-1 min-w-0">
        <h3 className={`
          text-sm font-semibold leading-tight mb-0.5
          ${activity.status === 'completed' ? 'line-through text-muted-foreground' : ''}
        `}>
          {activity.name}
        </h3>

        {/* Compact Info Row - Single Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {activity.start_time && (
            <span className="flex items-center gap-0.5">
              <ClockIcon className="h-3 w-3" />
              {formatTime(activity.start_time)}
            </span>
          )}
          
          {activity.location && (
            <span className="flex items-center gap-0.5 truncate max-w-[100px]">
              <MapPinIcon className="h-3 w-3 flex-shrink-0" />
              {activity.location}
            </span>
          )}

          {activity.cost !== null && activity.cost > 0 && (
            <span className="flex items-center gap-0.5 text-green-600 font-medium">
              <DollarSignIcon className="h-3 w-3" />
              {formatCurrency(activity.cost, activity.currency)}
            </span>
          )}

          {activity.status === 'completed' && (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          )}
        </div>
      </div>

      {/* Actions Menu - Compact 3 Dots */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="
              flex-shrink-0 p-1 rounded-lg
              hover:bg-white/10
              transition-colors duration-150
            "
            aria-label="More actions"
          >
            <MoreVerticalIcon className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card border-white/20 w-40">
          {onViewDetails && (
            <DropdownMenuItem onClick={() => onViewDetails(activity)} className="text-sm">
              <EyeIcon className="h-3.5 w-3.5 mr-2" />
              View
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => onEdit(activity)} className="text-sm">
            <EditIcon className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>

          {onMove && (
            <DropdownMenuItem onClick={() => onMove(activity)} className="text-sm">
              <MoveIcon className="h-3.5 w-3.5 mr-2" />
              Move
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleDeleteClick}
            className="text-red-500 focus:text-red-600 text-sm"
          >
            <TrashIcon className="h-3.5 w-3.5 mr-2" />
            {confirmDelete ? 'Confirm' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
