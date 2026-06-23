# Myriad Academy Portal — Backend Engine

The centralized REST API backend architecture powering **Myriad Academy Portal**.

Built with **Node.js** and **Express.js v5**, this backend acts as a secure API layer between the frontend application and the **Supabase Cloud Database Engine**.

It manages:

* User authentication
* Role-based access validation
* Profile management
* Database synchronization
* Future file/avatar upload handling

---

# Core Features

## Secure Role-Based Access Validation

The backend validates registration requests and controls privilege escalation.

Supported roles:

* `admin`
* `teacher`
* `student`

Admin registration requires a secure `ADMIN_SIGNUP_SECRET` environment variable to prevent unauthorized administrative account creation.

---

## Synchronized Database Profile Seeding

The system integrates with Supabase Authentication.

When a user successfully registers:

1. Supabase creates the authentication account.
2. User metadata is automatically inserted into the `myriad_users` relational database table.

This keeps authentication data and application profiles synchronized.

---

## Modular REST API Architecture

The backend uses a structured Express Router system.

API methods:

* `POST` → Authentication operations
* `PUT` → Profile/data updates

All routes are grouped under:

```text
/api/auth_routes
```

---

## Binary Upload Ready

The backend includes:

```text
multer
```

for handling multipart form data.

This prepares the system for:

* Profile avatar uploads
* Cloud storage integration
* Binary file processing

---

# Project Structure

```text
myriad-backend-main/

├── lib/
│   └── db.js
│       # Supabase client initialization

├── routes/
│   └── auth_routes.js
│       # Authentication and profile controllers

├── .gitignore
│   # Protects secrets and node_modules

├── package.json
│   # Dependencies and scripts

└── server.js
    # Express server entry point
```

---

# Technology Stack

| Technology          | Purpose                            |
| ------------------- | ---------------------------------- |
| Node.js             | Runtime environment                |
| Express.js v5.2.1   | Backend framework                  |
| Supabase JS v2.98.0 | Database and authentication client |
| bcrypt v6.0.0       | Password security utilities        |
| multer v2.1.1       | Multipart file handling            |
| dotenv v17.3.1      | Environment configuration          |
| nodemon v3.1.14     | Development hot reload             |

---

# API Documentation

Base route:

```text
/api/auth_routes
```

---

# User Registration

## POST

```text
/signup
```

Access:

```text
Public
```

Payload:

```json
{
  "name": "John Doe",
  "email": "johndoe@myriad.com",
  "password": "securepassword123",
  "role": "student",
  "adminSecret": "required_only_for_admin"
}
```

Supported roles:

```text
admin
teacher
student
```

Response:

```json
{
  "message": "Account created. Check email for confirmation!"
}
```

---

# User Authentication

## POST

```text
/login
```

Access:

```text
Public
```

Payload:

```json
{
  "email": "johndoe@myriad.com",
  "password": "securepassword123"
}
```

Response:

```json
{
  "message": "Login Successful",
  "user": {},
  "session": {}
}
```

Returns:

* User profile data
* Supabase authentication session

---

# Update User Profile

## PUT

```text
/update-profile/:id
```

Access:

```text
Authenticated users
```

Payload:

```json
{
  "name": "John Doe Updated",
  "phone": "+2348030000000",
  "dateOfBirth": "YYYY-MM-DD",
  "stateOfOrigin": "Ogun State",
  "address": "Omoloye Bus Stop",
  "profile_image": "bucket_url_string"
}
```

Response:

Returns the updated profile database object.

---

# Installation Guide

## Clone Repository

```bash
git clone https://github.com/CodeJoker24/myriad-backend-main.git

cd myriad-backend-main
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create:

```text
.env
```

Inside the project root:

```env
PORT=4000

SUPABASE_URL=your_supabase_project_url_here

SUPABASE_ANON_KEY=your_supabase_anonymous_public_key_here

ADMIN_SIGNUP_SECRET=your_secure_admin_creation_handshake_phrase
```

---

# Running The Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

---

# Server Status

When successfully started:

```text
App is running on port http://127.0.0.1:4000
```

---

# Future Improvements

Planned upgrades:

* JWT middleware protection
* Advanced permission system
* Cloud avatar upload pipeline
* Email verification handling
* Admin dashboard API
* Student result management API

---

# Author

**CODE_JOKER**

Myriad Academy Portal Backend System
