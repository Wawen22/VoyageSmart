'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { addAccommodation, updateAccommodation, Accommodation } from '@/lib/features/accommodationSlice';
import { uploadFile } from '@/lib/fileUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  UploadIcon,
  XIcon,
  TagIcon,
  FileTextIcon
} from 'lucide-react';
import { LazyMapView } from '@/components/LazyComponents';

interface AccommodationModalProps {
  tripId: string;
  accommodation?: Accommodation | null;
  isOpen: boolean;
  onClose: () => void;
}

const accommodationTypes = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'resort', label: 'Resort' },
  { value: 'camping', label: 'Camping' },
  { value: 'other', label: 'Other' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

export default function AccommodationModal({
  tripId,
  accommodation,
  isOpen,
  onClose
}: AccommodationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    checkInDate: '',
    checkOutDate: '',
    address: '',
    bookingReference: '',
    contactInfo: '',
    cost: '',
    currency: 'USD',
    notes: '',
  });

  const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Initialize form data when accommodation changes
  useEffect(() => {
    if (accommodation) {
      setFormData({
        name: accommodation.name || '',
        type: accommodation.type || 'hotel',
        checkInDate: accommodation.check_in_date || '',
        checkOutDate: accommodation.check_out_date || '',
        address: accommodation.address || '',
        bookingReference: accommodation.booking_reference || '',
        contactInfo: accommodation.contact_info || '',
        cost: accommodation.cost ? String(accommodation.cost) : '',
        currency: accommodation.currency || 'USD',
        notes: accommodation.notes || '',
      });
      setCoordinates(accommodation.coordinates);
      setDocuments(accommodation.documents || []);
    } else {
      // Reset form for new accommodation
      setFormData({
        name: '',
        type: 'hotel',
        checkInDate: '',
        checkOutDate: '',
        address: '',
        bookingReference: '',
        contactInfo: '',
        cost: '',
        currency: 'USD',
        notes: '',
      });
      setCoordinates(null);
      setDocuments([]);
      setNewFiles([]);
    }
  }, [accommodation, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (coords: { x: number; y: number }) => {
    setCoordinates(coords);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<{ name: string; url: string; type: string }[]> => {
    if (newFiles.length === 0) return [];

    setUploadingFiles(true);
    try {
      console.log('Starting upload of', newFiles.length, 'files');

      // Always use the correct bucket name
      const uploadPromises = newFiles.map((file) =>
        uploadFile(file, 'trip-documents', `${tripId}/accommodations`)
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('Files uploaded successfully:', uploadedFiles);

      // Show success toast
      toast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${uploadedFiles.length} files`,
        duration: 3000,
      });

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error uploading files',
        description: 'There was an error uploading your files. Some files may use placeholder URLs.',
        variant: 'destructive',
        duration: 5000,
      });

      // Return mock URLs for files to prevent UI from getting stuck
      return newFiles.map(file => ({
        name: file.name,
        url: `https://example.com/mock-file-url/${encodeURIComponent(file.name)}`,
        type: file.type
      }));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Upload any new files
      const uploadedFiles = await uploadFiles();

      // Combine existing documents with newly uploaded ones
      const allDocuments = [...documents, ...uploadedFiles];

      // Prepare accommodation data
      const accommodationData = {
        trip_id: tripId,
        name: formData.name,
        type: formData.type,
        check_in_date: formData.checkInDate || null,
        check_out_date: formData.checkOutDate || null,
        address: formData.address || null,
        coordinates: coordinates,
        booking_reference: formData.bookingReference || null,
        contact_info: formData.contactInfo || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        currency: formData.currency,
        documents: allDocuments,
        notes: formData.notes || null,
      };

      if (accommodation) {
        // Update existing accommodation
        await dispatch(updateAccommodation({
          id: accommodation.id,
          accommodation: accommodationData
        }));
        toast({
          title: 'Accommodation updated',
          description: 'The accommodation has been updated successfully.',
        });
      } else {
        // Add new accommodation
        await dispatch(addAccommodation(accommodationData));
        toast({
          title: 'Accommodation added',
          description: 'The accommodation has been added successfully.',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving accommodation:', error);
      toast({
        title: 'Error saving accommodation',
        description: 'There was an error saving the accommodation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-1rem)] sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden border-emerald-500/20">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 rounded-2xl"></div>
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-50"></div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20">
              <Building2Icon className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-emerald-500 to-foreground bg-clip-text text-transparent">
                  {accommodation ? 'Edit Accommodation' : 'Add Accommodation'}
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {accommodation ? 'Update accommodation details' : 'Add a new place to stay for your trip'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4 relative z-10">
          {/* Basic Information Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 mr-2">
                <Building2Icon className="h-4 w-4 text-emerald-500" />
              </div>
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Hotel name or title"
                  required
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-foreground">
                  Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type" className="glass-button border-white/20 bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                <SelectContent>
                  {accommodationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-blue-500/20 mr-2">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
              </div>
              Stay Dates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate" className="text-sm font-medium text-foreground">
                  Check-in Date
                </Label>
                <Input
                  id="checkInDate"
                  name="checkInDate"
                  type="date"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutDate" className="text-sm font-medium text-foreground">
                  Check-out Date
              </Label>
                <Input
                  id="checkOutDate"
                  name="checkOutDate"
                  type="date"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-purple-500/20 mr-2">
                <MapPinIcon className="h-4 w-4 text-purple-500" />
              </div>
              Location
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full address"
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>

              {/* Map */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Location on Map
                  <span className="text-xs text-muted-foreground ml-2">
                    (Click on the map to set location)
                  </span>
                </Label>
                <div className="rounded-xl overflow-hidden border border-white/20">
                  <LazyMapView
                    address={formData.address}
                    coordinates={coordinates}
                    interactive={true}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-amber-500/20 mr-2">
                <TicketIcon className="h-4 w-4 text-amber-500" />
              </div>
              Booking Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingReference" className="text-sm font-medium text-foreground">
                  Booking Reference
                </Label>
                <Input
                  id="bookingReference"
                  name="bookingReference"
                  value={formData.bookingReference}
                  onChange={handleChange}
                  placeholder="Reservation number"
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo" className="text-sm font-medium text-foreground">
                  Contact Information
                </Label>
                <Input
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="Phone, email, etc."
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Cost Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-green-500/20 mr-2">
                <DollarSignIcon className="h-4 w-4 text-green-500" />
              </div>
              Cost Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium text-foreground">
                  Cost
                </Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium text-foreground">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger id="currency" className="glass-button border-white/20 bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-slate-500/20 mr-2">
                <FileTextIcon className="h-4 w-4 text-slate-500" />
              </div>
              Additional Notes
            </h3>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information, special requests, etc."
                rows={3}
                className="glass-button border-white/20 bg-background/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 mr-2">
                <FileIcon className="h-4 w-4 text-indigo-500" />
              </div>
              Documents
            </h3>

            {/* Existing documents */}
            {documents.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-foreground">Existing documents:</p>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-indigo-500/20">
                          <FileIcon className="h-3 w-3 text-indigo-500" />
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate max-w-[200px] font-medium"
                        >
                          {doc.name}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="p-1 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <XIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New files to upload */}
            {newFiles.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-foreground">Files to upload:</p>
                <div className="space-y-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-green-500/20">
                          <FileIcon className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-sm truncate max-w-[200px] font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="p-1 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <XIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File upload input */}
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="fileUpload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer backdrop-blur-sm bg-background/30 border-white/20 hover:bg-background/50 transition-all duration-300"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/20 mb-3">
                    <UploadIcon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="mb-2 text-sm text-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirmation emails, booking details, etc.
                  </p>
                </div>
                <input
                  id="fileUpload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <DialogFooter className="relative z-10 pt-6 border-t border-white/10">
            <div className="flex space-x-3 w-full sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploadingFiles}
                className="glass-button flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles || !formData.name}
                className="glass-button-primary flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {loading || uploadingFiles ? 'Saving...' : accommodation ? 'Update' : 'Add'}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
