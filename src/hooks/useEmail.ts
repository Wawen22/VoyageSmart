import { useState } from 'react';
import { logger } from '@/lib/logger';

interface EmailHookState {
  sending: boolean;
  error: string | null;
  success: boolean;
}

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  tripName: string;
  inviteLink: string;
}

interface TripUpdatedEmailParams {
  to: string;
  tripName: string;
  updaterName: string;
  changes: string[];
  tripLink: string;
}

interface NewActivityEmailParams {
  to: string;
  tripName: string;
  activityName: string;
  activityDate: string;
  addedByName: string;
  tripLink: string;
}

export function useEmail() {
  const [state, setState] = useState<EmailHookState>({
    sending: false,
    error: null,
    success: false,
  });

  const resetState = () => {
    setState({
      sending: false,
      error: null,
      success: false,
    });
  };

  const sendInvitationEmail = async (params: InvitationEmailParams) => {
    try {
      setState({ ...state, sending: true, error: null, success: false });

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'invitation',
          ...params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Email API error', { error: data, status: response.status, statusText: response.statusText });
        throw new Error(data.error || `Failed to send invitation email: ${response.status} ${response.statusText}`);
      }

      // Check if there's a warning (for development mode)
      if (data.warning) {
        logger.warn('Email warning', { warning: data.warning });
        logger.debug('Mock email data', { mockData: data.mockData });
      }

      setState({ sending: false, error: null, success: true });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({ sending: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const sendTripUpdatedEmail = async (params: TripUpdatedEmailParams) => {
    try {
      setState({ ...state, sending: true, error: null, success: false });

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'trip_updated',
          ...params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Email API error', { error: data, status: response.status, statusText: response.statusText });
        throw new Error(data.error || `Failed to send trip updated email: ${response.status} ${response.statusText}`);
      }

      // Check if there's a warning (for development mode)
      if (data.warning) {
        logger.warn('Email warning', { warning: data.warning });
        logger.debug('Mock email data', { mockData: data.mockData });
      }

      setState({ sending: false, error: null, success: true });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({ sending: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const sendNewActivityEmail = async (params: NewActivityEmailParams) => {
    try {
      setState({ ...state, sending: true, error: null, success: false });

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'new_activity',
          ...params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Email API error', { error: data, status: response.status, statusText: response.statusText });
        throw new Error(data.error || `Failed to send new activity email: ${response.status} ${response.statusText}`);
      }

      // Check if there's a warning (for development mode)
      if (data.warning) {
        logger.warn('Email warning', { warning: data.warning });
        logger.debug('Mock email data', { mockData: data.mockData });
      }

      setState({ sending: false, error: null, success: true });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({ sending: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...state,
    resetState,
    sendInvitationEmail,
    sendTripUpdatedEmail,
    sendNewActivityEmail,
  };
}
