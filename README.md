## BRD: UI/UX for Healthcare Staffing Platform

This document outlines product scope, user journeys, pages, and UI/UX structure for the web app in this repo (client + server).

## Objectives

- Enable Nurses, Caretakers, and Compounders to submit applications for approval.
- Allow Admin and Staff to review, approve/reject applications, and manage approved users.
- Provide authentication, basic profiles, and role-based dashboards.

## Roles

- Admin: Full access; manages Staff and all role users; moderates applications.
- Staff: Moderates applications and manages approved users (no Staff management).
- Role Users: Nurse, Caretaker, Compounder (apply publicly; login after approval).
- Patient: Consumer-facing primary role. Can browse providers, filter by price/experience/location, and book.

## Information Architecture

- Public

  - Home
  - Browse Providers (catalog)
  - Apply (role selection + application form)
  - Application Status
  - Login

- Authenticated (all roles)

  - My Profile

- Patient Dashboard

  - My Bookings
  - Saved Providers (optional)

- Admin Dashboard

  - Overview
  - Applications: Pending, Approved, Rejected
  - Application Detail
  - Users: Nurses, Caretakers, Compounders
  - Staff Management: Create, List, Edit, Delete

- Staff Dashboard

  - Overview
  - Applications: Pending, Approved, Rejected
  - Users: Nurses, Caretakers, Compounders

- Role User Area (after approval)
  - My Profile

## Key Pages and UX

### Public Home

- Hero with primary CTA: Apply as Nurse / Caretaker / Compounder
- Secondary CTA: Check application status

### Apply (Role Selection)

- Cards for Nurse, Caretaker, Compounder -> proceed to form

### Browse Providers (Marketplace Catalog)

- Filters: role (Nurse/Caretaker/Compounder), price range, experience, rating, availability slot, location
- Results: provider cards with name, role, price, badges (experience, rating)
- Sorting: price, rating, experience

### Provider Detail

- Profile summary, skills, experience, price, availability (basic calendar), reviews (later)
- Actions: Book Now, Save Provider

### Booking Flow (Patient)

- Step 1: Select provider and date/time
- Step 2: Enter patient details and address
- Step 3: Review and confirm booking
- Show booking ID; visible in My Bookings

### Application Form

- Common fields: username, email, password, phone, address, profile picture (URL for v1)
- Documents section
  - Nurse: Government ID, Nursing Registration Certificate, Police Verification Certificate
  - Caretaker/Compounder: Government ID, Police Verification Certificate (extendable)
- On submit: show Application ID and link to Status

### Application Status

- Input: Application ID
- Display: role, status (Pending / Approved / Rejected), submitted date, rejection reason

### Login

- Email + Password -> JWT session

### My Profile

- ### Patient: My Bookings

- List upcoming/past bookings with status; view/cancel per policy

- View/edit username, phone, address, profile picture
- Change password

### Admin/Staff Overview

- KPI cards: Pending applications, Approved users, Rejected applications
- Recent activity

### Admin/Staff Applications List

- Tabs: Pending / Approved / Rejected
- Table columns: name, role, email, submittedAt, actions
- Filters: role, date

### Admin/Staff Application Detail

- Sections: applicant info, documents preview, actions
- Approve -> create real user in respective role
- Reject -> capture reason, mark rejected

### Admin/Staff Users Management

- Tabs: Nurses, Caretakers, Compounders
- Table: name, email, phone, updatedAt, actions (View, Edit, Delete)
- Edit: basic info; optional password reset

### Admin: Staff Management

- Create Staff form (username, email, password, phone, address, profile picture)
- List and manage Staff (edit, delete)

## Navigation

- Topbar
  - Public: Home, Browse, Apply, Status, Login
  - Patient: Browse, My Bookings
  - Admin/Staff: Dashboard, Applications, Users, (Admin only) Staff
  - Avatar menu: My Profile, Logout

## Core Components (Client)

- Inputs: TextInput, PhoneInput, FileUrlInput, Select, TextArea
- Table with pagination and sorting
- Tabs, Modal, Drawer, Toast
- GuardedRoute, PublicLayout, DashboardLayout

## Visual Guidelines

- Medical theme: blue/teal palette, whitespace, accessible contrast
- Primary/secondary/destructive buttons
- Inline validation; disable submit while processing

## API Mapping

- Public

  - POST /api/applications (submit application)
  - GET /api/applications/:id/status (check status)
  - POST /api/auth/login

- Authenticated

  - GET /api/auth/me

- Admin/Staff
  - Applications moderation
    - GET /api/admin/applications
    - GET /api/admin/applications/:id
    - POST /api/admin/applications/:id/approve
    - POST /api/admin/applications/:id/reject
  - Approved users management
    - GET /api/admin/users/:role
    - GET /api/admin/users/:role/:id
    - PUT /api/admin/users/:role/:id
    - DELETE /api/admin/users/:role/:id
  - Staff (Admin only)
    - POST /api/staff
    - GET /api/staff
    - GET /api/staff/:id
    - PUT /api/staff/:id
    - DELETE /api/staff/:id

### API Mapping (Planned - Marketplace)

- Public/Patient
  - GET /api/marketplace/providers (filters: role, priceMin, priceMax, experienceMin, ratingMin, availability, location)
  - GET /api/marketplace/providers/:id
  - POST /api/marketplace/bookings (Patient auth required)
  - GET /api/marketplace/bookings/me (Patient auth)
  - DELETE /api/marketplace/bookings/:id (Patient auth; cancel policy)

## User Flow (Application)

1. Applicant submits role application and receives Application ID
2. Admin/Staff reviews and approves or rejects
3. On approve, system creates real role user
4. Applicant logs in and can access profile

## Out of Scope (v1)

- Payments, advanced scheduling UI, messaging, file uploads/storage (beyond URL)

## Tech Notes

- JWT auth; role-based guards on protected routes
- Client shows inline errors and toasts on success/failure

---

## Appendix: Detailed Specifications

### Personas

- Admin: Operations lead who needs full visibility and control across applications, users, and staff.
- Staff: Coordinator who processes applications and manages approved role users.
- Professional (Nurse, Caretaker, Compounder): Applicant seeking approval; later maintains their profile.

### Permissions Matrix (Summary)

- Admin: Applications (list/view/approve/reject), Users (list/view/update/delete), Staff (create/list/view/update/delete)
- Staff: Applications (list/view/approve/reject), Users (list/view/update/delete), Staff (no access)
- Public: Submit application, check status, login

### Page-by-Page UX Details

1. Home (Public)

- Clear value proposition; CTA buttons to Apply and Check Status
- Secondary link to Login

2. Apply Flow

- Step 1: Role selection (cards with short descriptions)
- Step 2: Application form (role-aware validation)
- Submit: show Application ID and Status link

3. Application Form Fields

- Required: username, email, password, phone
- Optional: address, profilePicture (URL)
- Documents
  - Nurse: governmentId, nursingRegistrationCertificate, policeVerificationCertificate
  - Caretaker/Compounder: governmentId, policeVerificationCertificate

4. Application Status

- Input: Application ID
- Display: role, current status, submittedAt, rejectionReason (if rejected)

5. Admin/Staff Applications

- List with filters (role, status, date range)
- Detail view: applicant info, documents, timeline (submitted/reviewed)
- Actions: Approve (creates user), Reject (requires reason)

6. Approved Users Management (Admin/Staff)

- Tabs per role; searchable/sortable table (name, email, phone, updatedAt)
- View/Edit: update profile info; optional password reset
- Delete: confirm modal

7. Staff Management (Admin only)

- Create Staff form
- Staff list: view, edit, delete

### API Examples

- Submit Application

  - POST `/api/applications`
  - Body:
    {
    "username": "nurse.jane",
    "email": "jane@example.com",
    "password": "Passw0rd!",
    "phone": "9999999999",
    "address": "123 Rd",
    "profilePicture": "https://img/url.jpg",
    "role": "Nurse",
    "documents": {
    "governmentId": "Aadhaar-XXXX",
    "nursingRegistrationCertificate": "cert-123",
    "policeVerificationCertificate": "pvc-123"
    }
    }
  - Response: { "applicationId": "...", "status": "pending" }

- Approve Application (Admin/Staff)

  - POST `/api/admin/applications/:id/approve`
  - Auth: Bearer token
  - Response: { "userId": "..." }

- Manage Approved Users (Admin/Staff)
  - PUT `/api/admin/users/nurse/:id`
  - Body: any of username, email, phone, address, profilePicture, password

### Error Conventions

- 400: validation error
- 401: authentication required/invalid token
- 403: insufficient role
- 404: not found
- 409: conflict (e.g., email already exists)
- 500: server error

### Non-Functional Requirements

- Security: bcrypt password hashing; JWT expiry; minimal PII exposure in responses
- Performance: typical API responses under 500ms
- Reliability: resilient DB connection handling; idempotent moderation actions

### Roadmap (Post-v1)

- File uploads to object storage for documents
- Email notifications (submitted, approved, rejected)
- Password reset and email verification
- Basic audit logging for moderation
