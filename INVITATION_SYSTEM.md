# Invitation-Based User Registration System

## Overview
The application now uses an invitation-based registration system. Users can no longer self-register. Only managers can invite new team members via email.

## How It Works

### For Managers
1. Navigate to **Team Management** page
2. Click **"Invite Member"** button
3. Enter:
   - Email address of the person to invite
   - Role (Developer or Tester)
4. Click **"Send Invitation"**
5. An email will be sent to the invitee with a registration link
6. View pending and accepted invitations in the **Pending Invitations** card

### For Invitees
1. Receive an email with subject: "You're invited to join [Team Name]"
2. Click the invitation link in the email (valid for 7 days)
3. Complete registration form with:
   - Full Name
   - Username
   - Password (minimum 6 characters)
   - Email is pre-filled from invitation
4. Account is automatically created and added to the team

## Technical Details

### Backend Endpoints
- **POST /api/invitations/send** - Send invitation email
- **GET /api/invitations/verify/:token** - Verify invitation token
- **POST /api/invitations/accept/:token** - Accept invitation and create account
- **GET /api/invitations** - Get all invitations for a manager

### Database Model
- **Invitation Schema**:
  - `email`: Invitee's email
  - `role`: developer or tester
  - `teamId`: Team to join
  - `invitedBy`: Manager who sent invitation
  - `token`: Unique verification token
  - `status`: pending, accepted, or expired
  - `expiresAt`: Expiration date (7 days from creation)

### Frontend Pages
- **AcceptInvitation.tsx** - Registration page accessed via email link
- **TeamManagement.tsx** - Updated with invitation UI for managers

## Email Configuration

### SendGrid Setup Required
1. Create a SendGrid account at https://sendgrid.com/
2. Generate an API Key from SendGrid dashboard
3. Update `backend/.env` file:
   ```
   SENDGRID_API_KEY=your-actual-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=http://localhost:8080
   ```

### Email Template
The invitation email includes:
- Personalized greeting with manager's name
- Team name
- Role being offered
- Prominent call-to-action button
- Expiration notice (7 days)
- Professional HTML styling

## Security Features
- Tokens are cryptographically random (32 bytes)
- Tokens expire after 7 days
- Invitations can only be used once
- Email validation on backend
- Password must be at least 6 characters
- JWT authentication after account creation

## User Flow Changes
- **Removed**: Public registration page (`/register`)
- **Removed**: "Register" link from login page
- **Added**: Invitation-only onboarding via email
- **Added**: Invitation management UI for managers

## Testing
1. Ensure backend server is running: `cd backend && npm start`
2. Ensure frontend is running: `cd frontend && npm run dev`
3. Configure SendGrid API key in `backend/.env`
4. Login as a manager
5. Navigate to Team Management
6. Send test invitation
7. Check email for invitation link
8. Complete registration via invitation link

## Notes
- Only managers can send invitations
- Invitations are team-specific
- Users are automatically added to the team upon accepting
- Expired invitations cannot be used
- Duplicate invitations to the same email are allowed (creates new token)
