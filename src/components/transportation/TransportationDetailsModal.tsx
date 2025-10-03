'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { Transportation, deleteTransportation } from '@/lib/features/transportationSlice';
import { format, parseISO } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  MapPinIcon, 
  TicketIcon, 
  PhoneIcon, 
  DollarSignIcon, 
  FileIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  ClockIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { LazyTransportationMap } from '@/components/LazyComponents';

interface TransportationDetailsModalProps {
  transportation: Transportation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  getIcon: (type: string) => JSX.Element;
}

export default function TransportationDetailsModal({ 
  transportation, 
  isOpen, 
  onClose,
  onEdit,
  canEdit,
  getIcon
}: TransportationDetailsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transportation) return null;

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline';
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Not specified';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDelete = async () => {
    if (!transportation) return;
    
    setLoading(true);
    try {
      await dispatch(deleteTransportation(transportation.id)).unwrap();
      toast({
        title: 'Transportation deleted',
        description: 'The transportation has been successfully deleted.',
      });
      onClose();
    } catch (error) {
      console.error('Error deleting transportation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transportation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-[calc(100vw-1rem)] sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden border-sky-500/20">
          {/* Modern Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-cyan-500/5 opacity-50 rounded-2xl"></div>
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl opacity-50"></div>

          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20">
                  {getIcon(transportation.type)}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    <span className="bg-gradient-to-r from-foreground via-sky-500 to-foreground bg-clip-text text-transparent">
                      {transportation.provider || transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
                    </span>
                  </DialogTitle>
                  {transportation.booking_reference && (
                    <div className="mt-1">
                      <span className="text-sm text-muted-foreground">
                        Ref: {transportation.booking_reference}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              {transportation.status && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusBadgeVariant(transportation.status) === 'success' ? 'bg-green-400 animate-pulse' : 'bg-sky-400 animate-pulse'}`}></div>
                  <span className="text-xs text-muted-foreground">{getStatusLabel(transportation.status)}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4 relative z-10">
            {/* Travel Information Section */}
            {(transportation.departure_time || transportation.departure_location || transportation.arrival_time || transportation.arrival_location) && (
              <div className="glass-info-card p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 mr-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  Travel Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Departure */}
                  {(transportation.departure_time || transportation.departure_location) && (
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 rounded-lg bg-green-500/20">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Departure</p>
                      </div>
                      {transportation.departure_time && (
                        <p className="text-sm font-semibold text-foreground">
                          {format(parseISO(transportation.departure_time), 'PPP HH:mm')}
                        </p>
                      )}
                      {transportation.departure_location && (
                        <p className="text-sm text-foreground mt-1">{transportation.departure_location}</p>
                      )}
                    </div>
                  )}

                  {/* Arrival */}
                  {(transportation.arrival_time || transportation.arrival_location) && (
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 rounded-lg bg-red-500/20">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Arrival</p>
                      </div>
                      {transportation.arrival_time && (
                        <p className="text-sm font-semibold text-foreground">
                          {format(parseISO(transportation.arrival_time), 'PPP HH:mm')}
                        </p>
                      )}
                      {transportation.arrival_location && (
                        <p className="text-sm text-foreground mt-1">{transportation.arrival_location}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Section */}
            {(transportation.departure_coordinates || transportation.arrival_coordinates) && (
              <div className="glass-info-card p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 mr-2">
                    <MapPinIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  Route Map
                </h3>

                <div className="rounded-xl overflow-hidden border border-white/20">
                  <LazyTransportationMap
                    transportations={[transportation]}
                    height="200px"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {transportation.cost !== null && (
                <div className="flex items-start">
                  <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cost</p>
                    <p className="text-sm">{formatCurrency(transportation.cost, transportation.currency)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {transportation.notes && (
              <div className="flex items-start">
                <FileIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{transportation.notes}</p>
                </div>
              </div>
            )}

            {/* Documents */}
            {transportation.documents && transportation.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  Documents
                </p>
                <div className="space-y-2 pl-6">
                  {transportation.documents.map((doc, index) => (
                    <div key={index} className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center"
                      >
                        {doc.name}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="relative z-10 pt-6 border-t border-white/10 modal-footer-mobile">
            <div className="flex flex-col sm:flex-row sm:justify-between w-full gap-3">
              {/* Delete button - Mobile: compact width, Desktop: left aligned */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="glass-button inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-destructive-foreground bg-destructive/90 hover:bg-destructive backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 disabled:opacity-50 w-fit sm:w-auto"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}

              {/* Action buttons - Mobile: full width row, Desktop: right aligned */}
              <div className="flex space-x-3 sm:ml-auto">
                {canEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    disabled={loading}
                    className="glass-button-primary inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="glass-button inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transportation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
