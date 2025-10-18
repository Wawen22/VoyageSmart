'use client';

import { useState } from 'react';
import { ChecklistButton } from '@/components/trips/ChecklistButton';
import { ChecklistModal } from '@/components/trips/ChecklistModal';

interface TripChecklistTriggerProps {
  tripId: string;
  buttonClassName?: string;
  buttonDisabled?: boolean;
}

export function TripChecklistTrigger({
  tripId,
  buttonClassName,
  buttonDisabled
}: TripChecklistTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <>
      <ChecklistButton
        onClick={() => setIsModalOpen(true)}
        pendingCount={pendingCount}
        disabled={buttonDisabled}
        className={buttonClassName}
      />
      <ChecklistModal
        tripId={tripId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onPendingCountChange={setPendingCount}
      />
    </>
  );
}

