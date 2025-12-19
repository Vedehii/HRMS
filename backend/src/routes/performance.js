import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import PerformanceRecord from "../models/PerformanceRecord.js"
import Employee from "../models/Employee.js"
import AuditLog from "../models/AuditLog.js"

const router = express.Router()

// Get performance records
router.get("/", authenticate, async (req, res) => {
  try {
    const { employeeId } = req.query
    const query = {}

    // Employees can only see their own records
    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user.id })
      if (employee) {
        query.employee = employee._id
      }
    } else if (employeeId) {
      query.employeeId = employeeId
    }

    const records = await PerformanceRecord.find(query)
      .populate("employee")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })

    res.json(records)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create performance record (HR/Admin only)
router.post("/", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { employeeId, reviewPeriod, rating, strengths, areasOfImprovement, goals, comments } = req.body

    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const record = new PerformanceRecord({
      employee: employee._id,
      employeeId,
      reviewPeriod,
      rating,
      strengths,
      areasOfImprovement,
      goals,
      comments,
      reviewedBy: req.user.id,
    })

    await record.save()

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "CREATE_PERFORMANCE_RECORD",
      resource: "PerformanceRecord",
      resourceId: record._id,
      details: { employeeId, rating, reviewPeriod },
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update performance record (HR/Admin only)
router.put("/:id", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const record = await PerformanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "UPDATE_PERFORMANCE_RECORD",
      resource: "PerformanceRecord",
      resourceId: record._id,
      details: { employeeId: record.employeeId },
    })

    res.json(record)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router
