import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  MapPinIcon, 
  ClockIcon, 
  DollarSignIcon, 
  FileIcon, 
  TrashIcon, 
  EditIcon, 
  MoveIcon, 
  EyeIcon,
  UtensilsIcon,
  LandmarkIcon,
  CarIcon,
  HotelIcon,
  ActivityIcon as DefaultIcon
} from 'lucide-react';
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

type ActivityCardProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMove?: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (activityId: string, isSelected: boolean) => void;
  isDragging?: boolean;
};

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onMove,
  onViewDetails,
  isSelectable = false,
  isSelected = false,
  onSelectChange,
  isDragging = false
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

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3:
      default: return 'Low';
    }
  };

  const getPriorityBorderColor = (priority: number) => {
    switch (priority) {
      case 1: return 'border-l-red-500';
      case 2: return 'border-l-orange-500';
      case 3:
      default: return 'border-l-blue-500';
    }
  };

  const getPriorityOrbGradient = (priority: number) => {
    switch (priority) {
      case 1: return 'from-red-500/30 to-red-600/20';
      case 2: return 'from-orange-500/30 to-orange-600/20';
      case 3:
      default: return 'from-blue-500/30 to-blue-600/20';
    }
  };

  const getCategoryIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'food':
      case 'restaurant':
        return UtensilsIcon;
      case 'culture':
      case 'museum':
      case 'monument':
        return LandmarkIcon;
      case 'transport':
      case 'transportation':
        return CarIcon;
      case 'accommodation':
      case 'hotel':
        return HotelIcon;
      default:
        return DefaultIcon;
    }
  };

  const getCategoryGradient = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'food':
      case 'restaurant':
        return 'from-orange-500/20 to-amber-500/20';
      case 'culture':
      case 'museum':
      case 'monument':
        return 'from-purple-500/20 to-pink-500/20';
      case 'transport':
      case 'transportation':
        return 'from-blue-500/20 to-cyan-500/20';
      case 'accommodation':
      case 'hotel':
        return 'from-teal-500/20 to-emerald-500/20';
      default:
        return 'from-blue-500/20 to-purple-500/20';
    }
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

  const CategoryIcon = getCategoryIcon(activity.type);
  const isCompleted = activity.status === 'completed';

  return (
    <div 
      className={`
        group relative glass-card rounded-2xl p-4 
        border-l-4 ${getPriorityBorderColor(activity.priority)}
        hover:shadow-2xl transition-all duration-500 
        md:hover:scale-[1.02] hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''}
        ${isDragging ? 'opacity-60 rotate-2 scale-95' : ''}
        ${isCompleted ? 'opacity-70' : ''}
      `}
    >
      {/* Animated Background Orbs */}
      <div className={`
        absolute -top-12 -right-12 w-24 h-24 
        bg-gradient-to-br ${getCategoryGradient(activity.type)}
        rounded-full blur-3xl opacity-0 
        group-hover:opacity-100 transition-all duration-700
      `} />
      <div className={`
        absolute -bottom-12 -left-12 w-24 h-24 
        bg-gradient-to-br ${getPriorityOrbGradient(activity.priority)}
        rounded-full blur-3xl opacity-0 
        group-hover:opacity-100 transition-all duration-700
      `} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern rounded-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-start gap-3">
          {/* Checkbox for selection */}
          {isSelectable && (
            <div className="pt-1 flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectChange?.(activity.id, checked === true)}
                aria-label={`Select ${activity.name}`}
                className="border-white/30 data-[state=checked]:bg-blue-500"
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title with icon */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`
                p-1.5 rounded-lg bg-gradient-to-br ${getCategoryGradient(activity.type)}
                backdrop-blur-sm border border-white/10
              `}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <h3 className={`
                text-sm sm:text-base font-bold 
                group-hover:text-blue-500 transition-colors duration-300
                ${isCompleted ? 'line-through' : ''}
              `}>
                {activity.name}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {activity.start_time && (
                <div className="
                  inline-flex items-center px-2.5 py-1 rounded-full 
                  text-xs font-medium bg-blue-500/20 text-blue-600 
                  border border-blue-500/30 backdrop-blur-sm
                ">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatTime(activity.start_time)}
                  {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                </div>
              )}

              {activity.location && (
                <div className="
                  inline-flex items-center px-2.5 py-1 rounded-full 
                  text-xs font-medium bg-purple-500/20 text-purple-600 
                  border border-purple-500/30 backdrop-blur-sm
                ">
                  <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{activity.location}</span>
                </div>
              )}

              {activity.cost !== null && activity.cost > 0 && (
                <div className="
                  inline-flex items-center px-2.5 py-1 rounded-full 
                  text-xs font-medium bg-green-500/20 text-green-600 
                  border border-green-500/30 backdrop-blur-sm
                ">
                  <DollarSignIcon className="h-3 w-3 mr-1" />
                  {formatCurrency(activity.cost, activity.currency)}
                </div>
              )}

              {activity.booking_reference && (
                <div className="
                  inline-flex items-center px-2.5 py-1 rounded-full 
                  text-xs font-medium bg-amber-500/20 text-amber-600 
                  border border-amber-500/30 backdrop-blur-sm
                ">
                  <FileIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">{activity.booking_reference}</span>
                </div>
              )}
            </div>

            {/* Notes Preview */}
            {activity.notes && (
              <div className="
                mt-3 p-3 rounded-xl 
                bg-background/30 border border-white/10 
                backdrop-blur-sm
              ">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activity.notes}
                </p>
              </div>
            )}
          </div>

          {/* Priority Badge */}
          <div className="flex-shrink-0">
            <span className={`
              inline-flex items-center px-2.5 py-1 rounded-full 
              text-xs font-medium backdrop-blur-sm
              ${activity.priority === 1 ? 'bg-red-500/20 text-red-600 border border-red-500/30' : ''}
              ${activity.priority === 2 ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30' : ''}
              ${activity.priority === 3 ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' : ''}
            `}>
              {getPriorityLabel(activity.priority)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="
          mt-4 pt-3 border-t border-white/10
          flex justify-end items-center gap-1
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(activity)}
              className="
                p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 
                text-blue-600 transition-all duration-300 hover:scale-110
              "
              aria-label="View details"
              title="View details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => onEdit(activity)}
            className="
              p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 
              text-purple-600 transition-all duration-300 hover:scale-110
            "
            aria-label="Edit activity"
            title="Edit"
          >
            <EditIcon className="h-4 w-4" />
          </button>

          {onMove && (
            <button
              onClick={() => onMove(activity)}
              className="
                p-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 
                text-green-600 transition-all duration-300 hover:scale-110
              "
              aria-label="Move activity"
              title="Move to another day"
            >
              <MoveIcon className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleDeleteClick}
            className={`
              p-2 rounded-xl transition-all duration-300 hover:scale-110
              ${confirmDelete
                ? 'bg-red-500/40 text-red-600 animate-pulse ring-2 ring-red-500/50'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-600'
              }
            `}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete activity'}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
