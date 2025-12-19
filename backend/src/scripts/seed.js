import mongoose from "mongoose"
import dotenv from "dotenv"
import xlsx from "xlsx"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

import User from "../models/User.js"
import Employee from "../models/Employee.js"

dotenv.config()

// ✅ ES-module safe __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ Excel file is in SAME folder as seed.js
const excelPath = path.join(__dirname, "BasicWorkDurationReport.xls")


const seedDatabase = async () => {
  try {
    // 🔹 Debug path (important)
    console.log("📄 Excel path:", excelPath)

    if (!fs.existsSync(excelPath)) {
      throw new Error("❌ Excel file not found at: " + excelPath)
    }

    // 🔹 Connect DB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // 🔹 Clear existing data
    await User.deleteMany({})
    await Employee.deleteMany({})
    console.log("🧹 Existing Users & Employees removed")

    // 🔹 Create Admin user
    await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    })
    console.log("👑 Admin user created")

    // 🔹 Create HR user
    await User.create({
      name: "HR Manager",
      email: "hr@example.com",
      password: "password123",
      role: "hr",
    })
    console.log("👩‍💼 HR user created")

    // 🔹 Read Excel file (CORRECT WAY)
    const workbook = xlsx.readFile(excelPath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" })

    const employees = []
    const seenEmployeeIds = new Set()

    // 🔹 Parse employee data
    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      if (row[0] === "Emp. Code:" && row[3]) {
        const employeeId = String(row[3]).trim().toUpperCase()
        const employeeName = row[12]
          ? String(row[12]).trim()
          : `Employee ${employeeId}`

        if (!seenEmployeeIds.has(employeeId)) {
          employees.push({
            employeeId,
            name: employeeName,
            email: `${employeeId.toLowerCase()}@company.com`,
            phone: "9999999999",
            department: "General",
            position: "Employee",
            baseSalary: 30000,
            joiningDate: new Date("2023-01-01"),
            bankAccount: {
              accountNumber: "0000000000",
              bankName: "NA",
              ifscCode: "NA000000",
            },
            status: "active",
          })

          seenEmployeeIds.add(employeeId)
        }
      }
    }

    if (employees.length === 0) {
      throw new Error("❌ No employees found in Excel file")
    }

    // 🔹 Insert Employees
    await Employee.insertMany(employees)
    console.log(`👥 ${employees.length} employees seeded from Excel`)

    console.log("🎉 Database seeded successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error.message)
    process.exit(1)
  }
}

seedDatabase()
