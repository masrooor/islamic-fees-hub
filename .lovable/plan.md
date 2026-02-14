

# Islamic Education Center - Fees Management System

## Overview
An admin-only fees management system for an Islamic education center, with a clean dashboard for managing students, tracking payments, and generating receipts. Students are organized by class/grade.

---

## Pages & Features

### 1. Login Page
- Simple admin login with email and password
- Secure access to the dashboard

### 2. Admin Dashboard (Home)
- **Revenue overview charts** showing monthly/yearly income trends
- **Summary cards**: Total students, total revenue, pending payments, today's collections
- **Recent payments** list for quick reference
- Quick action buttons (add student, record payment)

### 3. Student Management
- **Student list** with search and filter by class/grade
- **Add/Edit student** form: name, guardian name, contact, class/grade, enrollment date
- View individual student profile with their full payment history
- Delete/deactivate students

### 4. Fee Structure
- Define **tuition/monthly fees** per class/grade
- Define **registration/admission fees**
- Ability to set fee amounts and update them per academic term

### 5. Payment Tracking
- **Record payments** against a student (select student → select fee type → enter amount → save)
- Payment status tracking: Paid, Partial, Unpaid
- Filter payments by date range, class, or status
- View all outstanding/overdue balances

### 6. Receipt Generation
- Auto-generate a **printable receipt** after recording a payment
- Receipt includes: student name, class, fee type, amount paid, date, balance remaining, center name
- Print or download as PDF option

---

## Design & Layout
- **Sidebar navigation** with links: Dashboard, Students, Fee Structure, Payments, Receipts
- Clean, professional look with a light theme
- Responsive layout (works on desktop and tablet)
- All data stored locally in-browser initially (no backend needed to start)

---

## Data Model (Local State)
- **Students**: id, name, guardian, contact, class/grade, enrollment date, status
- **Fee Structure**: id, class/grade, fee type, amount
- **Payments**: id, student id, fee type, amount paid, date, receipt number, notes

