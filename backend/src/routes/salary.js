import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import Salary from "../models/Salary.js"
import Attendance from "../models/Attendance.js"
import AuditLog from "../models/AuditLog.js" // Import AuditLog model

const router = express.Router()

// Calculate salaries for a month
router.post("/calculate", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { monthYear } = req.body

    const attendanceRecords = await Attendance.find({ monthYear }).populate("employee")
    const results = []

    for (const attendance of attendanceRecords) {
      const employee = attendance.employee
      const perDaySalary = employee.baseSalary / 30

      // Calculate deductions
      // 1. Half days: deduct 50% of day salary
      const halfDayDeduction = attendance.halfDays * (perDaySalary * 0.5)

      // 2. Leaves: first 2 leaves are free, rest are chargeable
      const chargeableLeaves = Math.max(0, attendance.daysLeave - 2)
      const leaveDeduction = chargeableLeaves * perDaySalary

      const totalDeductions = halfDayDeduction + leaveDeduction
      const netSalary = employee.baseSalary - totalDeductions

      try {
        const salary = await Salary.findOneAndUpdate(
          { employee: employee._id, monthYear },
          {
            employeeId: employee.employeeId,
            employee: employee._id,
            monthYear,
            baseSalary: employee.baseSalary,
            daysPresent: attendance.daysPresent,
            daysLeave: attendance.daysLeave,
            halfDays: attendance.halfDays || 0,
            perDaySalary: Math.round(perDaySalary),
            deductions: Math.round(totalDeductions),
            netSalary: Math.round(netSalary),
          },
          { upsert: true, new: true },
        )
        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.name,
          status: "success",
          salary: {
            baseSalary: employee.baseSalary,
            halfDays: attendance.halfDays,
            chargeableLeaves,
            totalDeductions: Math.round(totalDeductions),
            netSalary: Math.round(netSalary),
          },
        })
      } catch (error) {
        results.push({ employeeId: employee.employeeId, status: "failed", reason: error.message })
      }
    }

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "CALCULATE_SALARIES",
      resource: "Salary",
      details: { monthYear, count: results.length },
    })

    res.json({ message: "Salaries calculated", results })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get salary records
router.get("/", authenticate, async (req, res) => {
  try {
    const { monthYear, status, employeeId } = req.query
    const query = {}

    if (monthYear) query.monthYear = monthYear
    if (status) query.status = status
    if (employeeId) query.employeeId = employeeId

    const salaries = await Salary.find(query)
      .populate("employee")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
    res.json(salaries)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Approve salary
router.put("/:id/approve", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: "completed", completedAt: new Date(), approvedBy: req.user.id },
      { new: true },
    )
      .populate("employee")
      .populate("approvedBy", "name email")

    if (!salary) return res.status(404).json({ message: "Salary not found" })
    res.json(salary)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get salary slip
router.get("/:id/slip", authenticate, async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id).populate("employee")
    if (!salary) return res.status(404).json({ message: "Salary not found" })
    res.json(salary)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
