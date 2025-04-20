import { Resend } from 'resend';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Resend with API key or use mock in development
export const resend = isDevelopment
  ? createMockResend()
  : new Resend(process.env.RESEND_API_KEY || '');

// Create a mock Resend client for development
function createMockResend() {
  return {
    emails: {
      send: async (options: any) => {
        console.log('MOCK EMAIL SENT:', {
          to: options.to,
          from: options.from,
          subject: options.subject,
          // Truncate HTML content for readability
          htmlPreview: options.html?.substring(0, 100) + '...',
        });

        // Return a successful mock response
        return {
          data: {
            id: 'mock-email-id-' + Math.random().toString(36).substring(2, 9),
            from: options.from,
            to: options.to,
            created_at: new Date().toISOString(),
          },
          error: null,
        };
      },
    },
  };
}

// Email templates
export const emailTemplates = {
  invitationEmail: {
    subject: 'You\'ve been invited to join a trip on VoyageSmart',
    from: 'VoyageSmart <noreply@voyagesmart.app>',
  },
  tripUpdatedEmail: {
    subject: 'A trip you\'re participating in has been updated',
    from: 'VoyageSmart <noreply@voyagesmart.app>',
  },
  newActivityEmail: {
    subject: 'New activity added to your trip',
    from: 'VoyageSmart <noreply@voyagesmart.app>',
  },
};

// Email sending functions
export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  tripName: string,
  inviteLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailTemplates.invitationEmail.from,
      to: [to],
      subject: emailTemplates.invitationEmail.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">You've been invited to join a trip on VoyageSmart</h2>
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${tripName}</strong> on VoyageSmart.</p>
          <p>VoyageSmart is a platform for planning and organizing trips with friends and family.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>If you're not already a VoyageSmart user, you'll need to create an account to join this trip.</p>
          <p>If you have any questions, please contact the trip organizer directly.</p>
          <p>Happy travels!</p>
          <p>The VoyageSmart Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error };
    }

    console.log('Invitation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending invitation email:', error);
    return { success: false, error };
  }
}

export async function sendTripUpdatedEmail(
  to: string,
  tripName: string,
  updaterName: string,
  changes: string[],
  tripLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailTemplates.tripUpdatedEmail.from,
      to: [to],
      subject: emailTemplates.tripUpdatedEmail.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Trip Update: ${tripName}</h2>
          <p>Hello,</p>
          <p><strong>${updaterName}</strong> has made changes to <strong>${tripName}</strong>.</p>

          <h3 style="color: #4b5563;">Changes made:</h3>
          <ul style="padding-left: 20px;">
            ${changes.map(change => `<li>${change}</li>`).join('')}
          </ul>

          <div style="margin: 30px 0;">
            <a href="${tripLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Trip
            </a>
          </div>

          <p>Happy travels!</p>
          <p>The VoyageSmart Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            You're receiving this email because you're a participant in this trip.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending trip updated email:', error);
      return { success: false, error };
    }

    console.log('Trip updated email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending trip updated email:', error);
    return { success: false, error };
  }
}

export async function sendNewActivityEmail(
  to: string,
  tripName: string,
  activityName: string,
  activityDate: string,
  addedByName: string,
  tripLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailTemplates.newActivityEmail.from,
      to: [to],
      subject: emailTemplates.newActivityEmail.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Activity Added: ${tripName}</h2>
          <p>Hello,</p>
          <p><strong>${addedByName}</strong> has added a new activity to <strong>${tripName}</strong>.</p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #4b5563; margin-top: 0;">${activityName}</h3>
            <p style="margin-bottom: 0;">Date: ${activityDate}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${tripLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Trip
            </a>
          </div>

          <p>Happy travels!</p>
          <p>The VoyageSmart Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            You're receiving this email because you're a participant in this trip.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending new activity email:', error);
      return { success: false, error };
    }

    console.log('New activity email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending new activity email:', error);
    return { success: false, error };
  }
}
