# 📘 Attendance Tracking System
> A full-stack system for teachers to mark attendance, upload students via CSV, generate reports, and send low-attendance alerts via Email, WhatsApp, and SMS.

---

## 🚀 Core Features
### 👩‍🏫 Teacher Features
- Secure login (JWT-based authentication)
- Protected routes (React + AuthContext)
- Dashboard showing classes, attendance stats, alerts
- Mark attendance for any class on any date
- Auto-create attendance sheet if not present
- Auto-sync:
  - Missing students added
  - Deleted students removed from records
- Lock attendance to prevent further editing
- View attendance history in a date range
- Download reports (PDF / CSV)
- View attendance of:
  - Entire class
  - A single student
  - A specific date or range

---

## 🧑‍🎓 Student Management

### ➕ Add Student
- Add student manually (roll number, name, email, phone, parent phone)
- Auto-update total student count in class

### 📥 Import Students from CSV
- CSV upload with **full validation**
- Detect:
  - Missing fields  
  - Invalid data  
  - Duplicate roll numbers  
- Insert all valid students  
- Auto-update total students  
- Delete uploaded file after processing  

### 🔁 Import Students From Another Class
- Copy all students from one class to another
- Preserve:
  - Roll number  
  - Name  
  - Phone / Parent phone  
  - Gender  
  - DOB  
  - Address  
- Auto-update total students  

### ✏️ Update Student
- Full update support for all fields

### ❌ Delete Student
- Student removed from:
  - Database
  - Attendance sheets (clean invalid entries)
- Class student count auto-decrements

---

## 📝 Attendance System

### 📅 Fetch Attendance for a Specific Date
- If not found → auto-create attendance with all students marked **Present**
- Auto-clean invalid student references
- Sync newly added students into existing attendance sheet

### 💾 Save / Update Attendance
- Prevent updates if attendance is locked
- Clean deleted student entries
- Populate student details on every update

### 🔒 Lock Attendance
- Prevent further edits after locking
- Used for final submission

### 📚 Attendance History
- View attendance across a custom date range
- Sorted chronologically

---

## 📝 Reports

Teachers can download the following types of reports:

- **Class-wise Attendance Report**
- **Individual Student Attendance Report**
- **Available Formats:**  
  - PDF  
  - CSV  

---

## 📡 Alert Conditions

An alert is automatically triggered when:

- **attendance_percentage < 75%**

### Types of Alerts Sent:
- 📧 **Email Notification**
- 💬 **WhatsApp Message**
- 📱 **SMS Message**


## 🛠️ Technology Stack

| Layer | Technologies |
|------|--------------|
| **Frontend** | React.js, React Router, Context API |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT, Protected Routes |
| **Alerts** | Nodemailer, WhatsApp API, SMS API |
| **CSV Handling** | csv-parser, validator functions |

---

## 📂 Project Structure

### 🔹 Backend
- **controllers/**
  - Handles attendance logic, student management, report generation
- **routes/**
  - All API endpoints (attendance, students, classes, reports)
- **models/**
  - Database schemas: Students, Attendance, Classes
- **middleware/**
  - Authentication, authorization, input validation
- **utils/**
  - CSV import tool  
  - Mail service for alerts  
  - WhatsApp/SMS notification helpers  
- **images/**
  - Optional folder for storing student profile images
- **server.js**
  - Entry point for starting the backend server

---

### 🔹 Frontend
- **src/**
  - React components, pages, hooks, UI logic
- **public/**
  - Static files (HTML, icons, assets)
- **package.json**
  - Frontend dependencies & scripts

---

### 🔹 Root
- **README.md**
  - Documentation for project setup, usage, features

## 🤝 Contributing

Feel free to open issues or contribute to the project through pull requests.  
All contributions that improve functionality, performance, or documentation are welcome.

---

## 📜 License

This project is free to use for **educational and institutional purposes**.  
Redistribution or commercial use may require additional permission.



