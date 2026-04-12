# 🏥 Ojasya Healthcare System

A full-stack healthcare management system built with **React**, **Node.js**, and **MySQL**.

---

## 🌟 Features

### 👥 User Roles
| Role | Access |
|------|--------|
| **Admin** | Full system access — manage staff, medicines, diseases, records |
| **Doctor** (Jr/Sr Resident) | Consultations, prescriptions, leave management |
| **Receptionist** | Patient registration, fee collection, assign doctors, update records, bills |
| **Pharmacist** | Dispense medicines, provide dosage & precautions |
| **Patient** | View prescriptions, bills, nutrition check |

### 🏥 Core Modules
- **Registration Flow**: Receptionist registers patient → assigns doctor → collects fee
- **Consultation**: Doctor updates diagnosis, selects medication type, adds notes
- **3 Medication Types**: Ayurveda 🌿 | Allopathy 💊 | Homeopathy 🔬
- **Prescriptions**: Doctor adds medicines with dosage, frequency, duration
- **Pharmacy**: Pharmacist dispenses with dosage instructions & precautions
- **Fee Collection**: 4 payment methods — Cash, UPI, NEFT/RTGS, Cheque
- **Bill Generation**: Itemized bills with print support
- **Messaging**: Internal communication — Doctor ↔ Receptionist ↔ Pharmacist
- **Leave Management**: Doctors apply/cancel leave; receptionist sees availability
- **Nutrition Checker**: Symptom-based nutritional deficiency analysis
- **Admin Panel**: Add/update medicines, diseases, doctors, staff, toggle active

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm or yarn

---

### 1. Database Setup

```bash
mysql -u root -p
```

```sql
CREATE DATABASE ojasya_healthcare;
USE ojasya_healthcare;
SOURCE /path/to/ojasya-healthcare/backend/config/schema.sql;
```

---

### 2. Backend Setup

```bash
cd ojasya-healthcare/backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ojasya_healthcare
JWT_SECRET=your_long_random_secret_here
FRONTEND_URL=http://localhost:3000
```

Start backend:
```bash
npm run dev
# or
node server.js
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ojasya-healthcare/frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ojasya.com | Admin@123 |

> **Note**: Admin is pre-seeded. Add doctors, receptionists, and pharmacists via Admin panel or `/signup` page.

---

## 📋 Workflow Guide

### Patient Registration Workflow
```
1. Patient signs up at /signup (role: patient)
2. Receptionist logs in → Register Visit
3. Select patient, enter complaint, choose visit type
4. Select medication type (Ayurveda/Allopathy/Homeopathy)
5. Assign available doctor
6. Collect fee (Cash/UPI/NEFT-RTGS/Cheque)
7. Doctor logs in → sees consultation → updates diagnosis
8. Doctor creates prescription with medicines
9. Pharmacist logs in → Dispense medicines → explains dosage & precautions
10. Receptionist generates bill
```

### Doctor Leave Workflow
```
1. Doctor logs in → Leave Management
2. Toggle "Apply Leave" → set dates & reason
3. Receptionist sees doctor as unavailable when assigning
4. Doctor can cancel leave to become available again
```

### Nutritional Check (Any User)
```
1. Navigate to Nutrition Check
2. Select symptoms from the tag cloud or type custom
3. Click "Analyze Symptoms"
4. System shows matched conditions with ranked results
5. View possible reasons, recommended nutrients & foods
```

---

## 🗄️ Database Schema Overview

```
users (patients)
doctors (junior_resident | senior_resident)
receptionists
pharmacists
admins
diseases (ICD codes)
medicines (ayurveda | allopathy | homeopathy)
patient_registrations
fee_collections (cash | upi | neft_rtgs | cheque)
consultations
prescriptions + prescription_items
dispensing_records
messages (internal communication)
bills
nutritional_conditions
notifications
```

---

## 🔗 API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/login | Public |
| POST | /api/auth/register | Public |
| GET | /api/patients | Admin, Receptionist, Doctor, Pharmacist |
| POST | /api/patients/register-visit | Receptionist, Admin |
| GET | /api/consultations | Doctor, Admin, Receptionist |
| POST | /api/consultations | Receptionist, Admin |
| PUT | /api/consultations/:id | Doctor, Admin |
| POST | /api/prescriptions | Doctor |
| GET | /api/prescriptions | Doctor, Pharmacist, Admin |
| POST | /api/dispensing | Pharmacist |
| POST | /api/fees | Receptionist, Admin |
| GET | /api/fees | Receptionist, Admin |
| POST | /api/bills | Receptionist, Admin |
| POST | /api/messages | Doctor, Receptionist, Pharmacist, Admin |
| GET | /api/messages | Doctor, Receptionist, Pharmacist, Admin |
| GET | /api/medicines | Doctor, Pharmacist, Admin |
| POST | /api/medicines | Admin |
| POST | /api/diseases | Admin |
| GET | /api/nutrition/check | Public |
| GET | /api/admin/stats | Admin |
| POST | /api/admin/staff | Admin |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6, Axios |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 with mysql2 driver |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Styling | Custom CSS with Google Fonts (Playfair Display + DM Sans) |

---

## 🎨 Design Highlights

- **Deep teal + navy** professional healthcare color scheme
- **Playfair Display** serif for headings, **DM Sans** for body
- Role-specific sidebars with contextual navigation
- Color-coded medication types (Ayurveda=amber, Allopathy=blue, Homeopathy=purple)
- Printable bill and prescription views
- Responsive split-panel layouts for record management

---

## 📦 Project Structure

```
ojasya-healthcare/
├── backend/
│   ├── config/
│   │   ├── db.js          # MySQL connection pool
│   │   └── schema.sql     # Full database schema + seed data
│   ├── middleware/
│   │   └── auth.js        # JWT middleware with role checking
│   ├── routes/
│   │   ├── auth.js        # Login & registration for all roles
│   │   ├── patients.js    # Patient CRUD + visit history
│   │   ├── clinical.js    # Fees, consultations, prescriptions, dispensing
│   │   └── main.js        # Medicines, diseases, messages, bills, admin
│   ├── server.js          # Express app entry point
│   ├── .env.example       # Environment template
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── contexts/
        │   └── AuthContext.js   # Global auth state
        ├── components/
        │   └── Sidebar.js       # Role-aware navigation
        ├── pages/
        │   ├── Auth.js          # Login + Signup
        │   ├── Dashboard.js     # Role-specific dashboards
        │   ├── Patients.js      # Patient list + register visit
        │   ├── FeeCollection.js # Fee collection + payment methods
        │   ├── Consultations.js # Consultations + prescriptions
        │   ├── Operations.js    # Messages, dispense, leave, bills
        │   ├── Admin.js         # Medicines, diseases, doctors, staff
        │   └── NutritionCheck.js # Symptom-based nutrition analysis
        ├── App.js               # Routes + layout
        ├── index.js             # React entry
        └── index.css            # Global styles + design system
```
