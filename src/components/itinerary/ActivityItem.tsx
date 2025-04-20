import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

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
};

export default function ActivityItem({ activity, onEdit, onDelete, onMove, onViewDetails }: ActivityItemProps) {
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
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-orange-100 text-orange-800';
      case 3:
      default:
        return 'bg-blue-100 text-blue-800';
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
    <div className="border border-border rounded-md p-3 sm:p-4 hover:border-primary/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-medium text-foreground">{activity.name}</h3>
          {activity.location && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {activity.location}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.start_time && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatTime(activity.start_time)}
              {activity.end_time && ` - ${formatTime(activity.end_time)}`}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
            {getPriorityLabel(activity.priority)}
          </span>
        </div>
      </div>

      {activity.notes && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">{activity.notes}</p>
      )}

      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          {activity.cost && (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {formatCurrency(activity.cost, activity.currency)}
            </span>
          )}
          {activity.booking_reference && (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              {activity.booking_reference}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onViewDetails && (
            <button
              className="text-primary hover:text-primary/90 text-xs sm:text-sm flex items-center"
              onClick={() => onViewDetails(activity)}
              aria-label="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Details
            </button>
          )}
          <button
            className="text-primary hover:text-primary/90 text-xs sm:text-sm flex items-center"
            onClick={() => onEdit(activity)}
            aria-label="Edit activity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          {onMove && (
            <button
              className="text-primary hover:text-primary/90 text-xs sm:text-sm flex items-center"
              onClick={() => onMove(activity)}
              aria-label="Move activity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
              </svg>
              Move
            </button>
          )}
          <button
            className={`${confirmDelete ? 'text-destructive font-medium' : 'text-destructive/80'} hover:text-destructive text-xs sm:text-sm flex items-center`}
            onClick={handleDeleteClick}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete activity'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
