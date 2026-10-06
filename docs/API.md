# EzQueue REST API Reference & Data Contracts

**Base URL**: `/api/v1`  
**Protocol**: HTTPS  
**Authentication**: Bearer JWT (`Authorization: Bearer <access_token>`)  
**Data Format**: JSON (`Content-Type: application/json`)

---

## Standard Response Structure

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "code": "ERROR_CODE_IDENTIFIER",
  "details": { ... }
}
```

---

## 1. Authentication & Profile (`/auth`)

### GET `/auth/me`
- **Auth**: Required (`customer`, `staff`, `facility_admin`, `system_admin`)
- **Description**: Returns authenticated profile with assigned role and facility. Includes idempotent `BOOTSTRAP_ADMIN_EMAIL` check for initial owners.
- **Output (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "role": "customer",
    "facility_id": null,
    "avatar_url": "https://...",
    "created_at": "ISO-8601"
  }
}
```

### POST `/auth/bootstrap`
- **Auth**: Required (`customer`)
- **Description**: Verifies caller email matches server-side `BOOTSTRAP_ADMIN_EMAIL`. If eligible, promotes user to `facility_admin` (Organization Owner).
- **Errors**: `403 Forbidden` (`NOT_ELIGIBLE`), `500 Internal Server Error`.

### PATCH `/auth/me` / PATCH `/auth/profile`
- **Auth**: Required
- **Input**:
```json
{
  "full_name": "Updated Name",
  "phone": "+91-9876543210",
  "avatar_url": "https://..."
}
```
- **Mass Assignment Guard**: Server ignores attempts to mutate `role`, `email`, or `id`.

---

## 2. Facilities & Organizations (`/facilities`)

### GET `/facilities`
- **Auth**: Optional
- **Query Params**:
  - `category` (optional string): e.g. `clinic`, `bank`, `government`
  - `city` (optional string): e.g. `Mumbai`
  - `search` (optional string): filter by name or description
- **Output (200 OK)**: Array of active facility objects with services and counter counts.

### GET `/facilities/:id`
- **Auth**: Optional
- **Output (200 OK)**: Facility details with nested active `services`, `counters`, and `business_hours`.

### POST `/facilities`
- **Auth**: Required (`facility_admin`, `system_admin`)
- **Input (Zod Validated)**:
```json
{
  "name": "CityCare Clinic",
  "category": "clinic",
  "address": "123 Health St",
  "city": "Mumbai",
  "country": "India",
  "phone": "+91-22-12345678",
  "max_capacity": 100
}
```
- **Output (201 Created)**: Created facility record.

---

## 3. Queue Management (`/queues`)

### POST `/queues/join`
- **Auth**: Required (`customer`)
- **Input**:
```json
{
  "facility_id": "uuid",
  "service_id": "uuid",
  "priority": "normal"
}
```
- **Output (201 Created)**:
```json
{
  "success": true,
  "data": {
    "ticket_id": "uuid",
    "ticket_number": "A-104",
    "status": "waiting",
    "position": 3,
    "estimated_wait_minutes": 15
  }
}
```

### GET `/queues/tickets/active`
- **Auth**: Required (`customer`)
- **Output (200 OK)**: Current active queue ticket, or `null` if not currently in queue.

### POST `/queues/tickets/:ticketId/call`
- **Auth**: Required (`staff`, `facility_admin`)
- **Input**:
```json
{
  "counter_id": "uuid"
}
```
- **Action**: Transitions ticket to `called`, emits sound chime announcement via Supabase Realtime to TV display.

### POST `/queues/tickets/:ticketId/start`
- **Auth**: Required (`staff`, `facility_admin`)
- **Action**: Transitions ticket from `called` to `in_service`.

### POST `/queues/tickets/:ticketId/complete`
- **Auth**: Required (`staff`, `facility_admin`)
- **Action**: Transitions ticket to `completed` and records end timestamp for analytics.

### POST `/queues/tickets/:ticketId/skip`
- **Auth**: Required (`staff`, `facility_admin`)
- **Action**: Marks customer absent and moves ticket to skipped pool.

---

## 4. Appointments (`/appointments`)

### POST `/appointments`
- **Auth**: Required (`customer`)
- **Input**:
```json
{
  "facility_id": "uuid",
  "service_id": "uuid",
  "appointment_date": "2026-10-15",
  "start_time": "10:30",
  "notes": "Consultation request"
}
```
- **Concurrency Check**: Atomically verifies slot availability and prevents double booking.
- **Output (201 Created)**: Appointment record with confirmation status.

### GET `/appointments`
- **Auth**: Required
- **Output**: Returns customer's appointments (for customers) or facility appointments (for staff/admins).

### PATCH `/appointments/:id/cancel`
- **Auth**: Required (Owner of appointment or facility staff)
- **Action**: Transitions status to `cancelled`.

---

## 5. Messaging Subsystem (`/conversations`)

### GET `/conversations`
- **Auth**: Required
- **Scoping**:
  - Customers only receive their own conversation threads.
  - Staff members only receive conversations belonging to their assigned facility.
  - Cross-tenant access is strictly denied.

### POST `/conversations`
- **Auth**: Required (`customer`)
- **Input**:
```json
{
  "facility_id": "uuid",
  "subject": "Question about consultation timing",
  "initial_message": "Hello, do I need to bring prior lab reports?"
}
```

### POST `/conversations/:id/messages`
- **Auth**: Required (Authorized participant or facility staff)
- **Input**:
```json
{
  "content": "Yes, please bring any lab reports from the past 3 months."
}
```
- **Realtime**: Message triggers Postgres change broadcast to conversation channel.

---

## 6. Health & Diagnostics (`/health`)

### GET `/health`
- **Auth**: Public
- **Output (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "production"
  }
}
```
