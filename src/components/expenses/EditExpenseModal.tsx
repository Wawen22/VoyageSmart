import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';

type Participant = {
  id: string;
  user_id: string;
  full_name: string;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  paid_by: string;
  paid_by_name?: string;
  split_type: string;
  participants?: {
    user_id: string;
    amount: number;
    is_paid: boolean;
    full_name: string;
  }[];
};

type EditExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  expense: Expense | null;
  participants: Participant[];
  currentUserId?: string;
  currency: string;
};

export default function EditExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  participants,
  currentUserId,
  currency
}: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    paidBy: currentUserId || '',
    splitType: 'equal',
    participants: [] as string[],
  });

  // Reset form when modal opens and expense changes
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        id: expense.id,
        description: expense.description || '',
        amount: expense.amount.toString(),
        date: expense.date,
        category: expense.category || 'other',
        paidBy: expense.paid_by,
        splitType: expense.split_type,
        participants: expense.participants 
          ? expense.participants.map(p => p.user_id)
          : participants.map(p => p.user_id),
      });
    }
  }, [isOpen, expense, participants, currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantChange = (userId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      participants: checked
        ? [...prev.participants, userId]
        : prev.participants.filter(id => id !== userId)
    }));
  };

  const handleSelectAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participants: participants.map(p => p.user_id)
    }));
  };

  const handleDeselectAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participants: []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    if (!formData.paidBy) {
      alert('Please select who paid');
      return;
    }
    
    if (formData.participants.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    
    // Submit the form
    onSubmit({
      ...formData,
      currency
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-card border-amber-500/20 expense-modal-mobile">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-50 rounded-2xl"></div>
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-50"></div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-amber-500 to-foreground bg-clip-text text-transparent">
                  Edit Expense
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update expense details and split
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4 relative z-10">
          {/* Basic Information Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-amber-500/20 mr-2">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What was this expense for?"
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-foreground">Amount</Label>
                  <div className="relative mt-1">
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="glass-button border-white/20 bg-background/50 backdrop-blur-sm pl-8"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-amber-500 font-semibold">
                      {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date" className="text-sm font-medium text-foreground">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category and Payment Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-blue-500/20 mr-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              Category & Payment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-foreground">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">🍔 Food & Drinks</SelectItem>
                    <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
                    <SelectItem value="transportation">🚗 Transportation</SelectItem>
                    <SelectItem value="activities">🎭 Activities</SelectItem>
                    <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                    <SelectItem value="other">💰 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paidBy" className="text-sm font-medium text-foreground">Paid by</Label>
                <Select
                  value={formData.paidBy}
                  onValueChange={(value) => handleSelectChange('paidBy', value)}
                >
                  <SelectTrigger className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1">
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.user_id} value={participant.user_id}>
                        {participant.full_name} {participant.user_id === currentUserId ? '(You)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Split Configuration Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-purple-500/20 mr-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Split Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="splitType" className="text-sm font-medium text-foreground">Split type</Label>
                <Select
                  value={formData.splitType}
                  onValueChange={(value) => handleSelectChange('splitType', value)}
                >
                  <SelectTrigger className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1">
                    <SelectValue placeholder="Select split type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Split equally</SelectItem>
                    <SelectItem value="custom" disabled>Custom split (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-foreground">Split with</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllParticipants}
                      className="glass-button px-3 py-1 text-xs rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllParticipants}
                      className="glass-button px-3 py-1 text-xs rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 space-y-2 max-h-[200px] overflow-y-auto">
                  {participants.map((participant) => (
                    <div key={participant.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background/30 transition-colors">
                      <Checkbox
                        id={`participant-${participant.user_id}`}
                        checked={formData.participants.includes(participant.user_id)}
                        onCheckedChange={(checked) =>
                          handleParticipantChange(participant.user_id, checked as boolean)
                        }
                        className="border-white/30"
                      />
                      <label
                        htmlFor={`participant-${participant.user_id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {participant.full_name} {participant.user_id === currentUserId ? '(You)' : ''}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Split Preview Section */}
          {formData.amount && formData.participants.length > 0 && (
            <div className="glass-info-card p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <div className="p-1.5 rounded-lg bg-green-500/20 mr-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                Split Preview
              </h3>
              <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Each person pays:</span>
                  <span className="font-bold text-lg text-amber-600">
                    {formatCurrency(
                      parseFloat(formData.amount) / formData.participants.length,
                      currency
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Split between {formData.participants.length} {formData.participants.length === 1 ? 'person' : 'people'}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="relative z-10 pt-6 border-t border-white/10">
            <div className="flex space-x-3 w-full sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="glass-button flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-button-primary flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
