# HR System - Backend API

Node.js + Express + MongoDB backend for HR Salary Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5000
```

3. Seed database (optional):
```bash
npm run seed
```

4. Start server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Required
All endpoints except `/auth/login` and `/auth/register` require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth Routes (`/api/auth`)
- `POST /login` - User login
- `POST /register` - Register new user
- `GET /me` - Get current user

#### Employee Routes (`/api/employees`)
- `GET /` - Get all employees (with filters)
- `POST /` - Create new employee
- `GET /:id` - Get employee by ID
- `PUT /:id` - Update employee
- `DELETE /:id` - Delete employee

#### Attendance Routes (`/api/attendance`)
- `POST /upload` - Upload attendance CSV
- `GET /` - Get attendance records
- `GET /employee/:employeeId` - Get employee attendance
- `PUT /:id` - Update attendance record

#### Salary Routes (`/api/salary`)
- `POST /calculate` - Calculate monthly salaries
- `GET /` - Get salary records (with filters)
- `GET /:id` - Get salary by ID
- `PUT /:id/approve` - Approve/Complete salary
- `GET /employee/:employeeId` - Get employee salary history

## Database Models

### User
- email, password, name, role

### Employee
- employeeId, name, email, department, position, baseSalary, perDaySalary, bankAccount, status

### Attendance
- employee, monthYear, daysPresent, daysLeave, totalDays, verified

### Salary
- employee, monthYear, baseSalary, daysPresent, daysLeave, perDaySalary, deductions, netSalary, status
