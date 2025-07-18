# User Flow for FixFlow

## Overview

This document outlines the user journey through the FixFlow platform, detailing the roles, authentication process, key features access, and how different user types interact with the system. The goal is to provide a clear, scalable structure for both small businesses and one-person operations.

---

Freemium Tier for Solopreneurs
• Offer a free plan for 1–5 users with core features (job scheduling, basic reports).

Entry-Level Paid Plan
• Priced ~$15–$30/user/month, includes job dispatch, maps, invoicing.

Mid-Tier Plan
• $40–$60/user/month, adds CRM, analytics, SMS/email automation.

Enterprise/Pro Plan
• $75+/user/month, includes team roles, analytics dashboards, integrations (Stripe, QuickBooks, etc.).

Team/Instance Pricing
• For larger teams, consider flat monthly plans (e.g., $200–$500/month for 15–25 users).



## User Roles

- **OWNER**
  - Full access to all system features
  - Manage users, jobs, and system settings
  - View all reports and analytics
  - Full company administration rights
  - Billing and subscription management

- **MANAGER**
  - Comprehensive system access
  - Manage team members and job assignments
  - Create and modify job templates
  - Generate and view detailed reports
  - Configure company-specific workflows

- **EMPLOYEE**
  - Access assigned jobs and job details
  - Update job statuses and log work done
  - View personal profile and schedule
  - Submit time tracking and job completion reports
  - Limited system configuration options



---

## User Flow Steps

### 1. Registration

- User visits the landing or registration page.
- Fills out registration form with essential info (username, email, password).
- Upon successful registration:
  - New users are assigned a default role (e.g., Client or Guest).
  - Redirected to login page or automatically logged in.

### 2. Login

- User provides credentials.
- On success:
  - JWT token is issued for authenticated session.
  - User is redirected based on role:
    - **Admin**: Dashboard overview with user management and reports.
    - **Technician**: Job list and job management interface.
    - **Client**: Job submission form and job status tracking page.
  - On failure:
    - Show error messages and allow retry or password reset.

### 3. Dashboard / Main Interface

- Displays relevant data and actions based on user role.
- Features dynamically adjust:
  - Admin sees system-wide stats and controls.
  - Technician sees assigned tasks and schedules.
  - Client sees their submitted jobs and communication logs.

### 4. Job Management (for Admin and Technicians)

- Create, assign, update, and close jobs.
- Attach notes, files, and timestamps.
- Notifications for job status changes.

### 5. Client Interaction

- Submit new job requests.
- View real-time status updates.
- Communicate with assigned technicians via comments or messaging.
- Receive email or in-app notifications on important updates.

### 6. Profile and Settings

- Users can view and update their profiles.
- Change password and notification preferences.
- Admins can manage user roles and permissions.

### 7. Logout

- User explicitly logs out.
- JWT token is invalidated or removed client-side.
- Redirect to login or landing page.

---

## Special Considerations

### Single-Person Shop

- User may have Admin + Technician + Client roles consolidated.
- Simplified interface to manage all aspects without switching accounts.
- Ability to quickly create jobs and update statuses from one dashboard.

### Small-Medium Companies

- Multi-user access with clear role separation.
- Admins manage users and oversee job distribution.
- Technicians focus on task execution.
- Clients primarily interact with status tracking and job requests.

---

## Summary Diagram (Optional)

[Landing Page] → [Registration] → [Login] → [Role-based Dashboard]
↓ ↓ ↓
Guest Registered Authenticated
↓
Role-based redirect



---

## Notes

- All role-based access control is enforced backend-side via JWT claims.
- Frontend dynamically adapts UI/UX based on user role from token.
- User session management handled via JWT with refresh mechanisms as needed.
- Future versions may include offline mode and mobile push notifications.

---

*Document last updated: YYYY-MM-DD*  