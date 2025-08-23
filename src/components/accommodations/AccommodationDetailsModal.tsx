'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { deleteAccommodation, Accommodation } from '@/lib/features/accommodationSlice';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { 
  Building2Icon, 
  CalendarIcon, 
  MapPinIcon, 
  TicketIcon, 
  PhoneIcon, 
  DollarSignIcon, 
  FileIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { LazyMapView } from '@/components/LazyComponents';

interface AccommodationDetailsModalProps {
  accommodation: Accommodation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

export default function AccommodationDetailsModal({ 
  accommodation, 
  isOpen, 
  onClose,
  onEdit,
  canEdit
}: AccommodationDetailsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!accommodation) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await dispatch(deleteAccommodation(accommodation.id));
      toast({
        title: 'Accommodation deleted',
        description: 'The accommodation has been deleted successfully.',
      });
      onClose();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      toast({
        title: 'Error deleting accommodation',
        description: 'There was an error deleting the accommodation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getAccommodationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      hotel: 'Hotel',
      apartment: 'Apartment',
      hostel: 'Hostel',
      house: 'House',
      villa: 'Villa',
      resort: 'Resort',
      camping: 'Camping',
      other: 'Other',
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass-card border-emerald-500/20">
          {/* Modern Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 rounded-2xl"></div>
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-50"></div>

          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20">
                  <Building2Icon className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    <span className="bg-gradient-to-r from-foreground via-emerald-500 to-foreground bg-clip-text text-transparent">
                      {accommodation.name}
                    </span>
                  </DialogTitle>
                  {accommodation.type && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                        {getAccommodationTypeLabel(accommodation.type)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4 relative z-10">
            {/* Dates Section */}
            {(accommodation.check_in_date || accommodation.check_out_date) && (
              <div className="glass-info-card p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 mr-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  Stay Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {accommodation.check_in_date && (
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 rounded-lg bg-green-500/20">
                          <CalendarIcon className="h-3 w-3 text-green-500" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Check-in</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(accommodation.check_in_date), 'PPP')}
                      </p>
                    </div>
                  )}

                  {accommodation.check_out_date && (
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1 rounded-lg bg-orange-500/20">
                          <CalendarIcon className="h-3 w-3 text-orange-500" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Check-out</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(accommodation.check_out_date), 'PPP')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Address and Map Section */}
            {accommodation.address && (
              <div className="glass-info-card p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 mr-2">
                    <MapPinIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  Location
                </h3>

                <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 mb-4">
                  <p className="text-sm font-medium text-foreground">{accommodation.address}</p>
                </div>

                {accommodation.coordinates && (
                  <div className="rounded-xl overflow-hidden border border-white/20">
                    <LazyMapView
                      coordinates={accommodation.coordinates}
                      interactive={false}
                      height="200px"
                    />
                  </div>
                )}
              </div>
            )}
            
            <Separator />
            
            {/* Booking Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accommodation.booking_reference && (
                <div className="flex items-start">
                  <TicketIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Booking Reference</p>
                    <p className="text-sm">{accommodation.booking_reference}</p>
                  </div>
                </div>
              )}
              
              {accommodation.contact_info && (
                <div className="flex items-start">
                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Information</p>
                    <p className="text-sm">{accommodation.contact_info}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Cost */}
            {accommodation.cost !== null && (
              <div className="flex items-start">
                <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cost</p>
                  <p className="text-sm">
                    {formatCurrency(accommodation.cost, accommodation.currency)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {accommodation.notes && (
              <div className="flex items-start">
                <FileIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{accommodation.notes}</p>
                </div>
              </div>
            )}
            
            {/* Documents */}
            {accommodation.documents && accommodation.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  Documents
                </p>
                <div className="space-y-2 pl-6">
                  {accommodation.documents.map((doc, index) => (
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
              This will permanently delete the accommodation "{accommodation.name}".
              This action cannot be undone.
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
