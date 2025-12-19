import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import LeaveRequest from "../models/LeaveRequest.js"
import Employee from "../models/Employee.js"
import AuditLog from "../models/AuditLog.js"

const router = express.Router()

// Get leave requests
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, employeeId } = req.query
    const query = {}

    if (status) query.status = status

    // Employees can only see their own leave requests
    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user.id })
      if (employee) {
        query.employee = employee._id
      }
    } else if (employeeId) {
      query.employeeId = employeeId
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate("employee")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })

    res.json(leaveRequests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Submit leave request (Employee only)
router.post("/", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" })
    }

    const { leaveType, startDate, endDate, reason } = req.body

    // Calculate number of days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    const leaveRequest = new LeaveRequest({
      employee: employee._id,
      employeeId: employee.employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    })

    await leaveRequest.save()

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "SUBMIT_LEAVE_REQUEST",
      resource: "LeaveRequest",
      resourceId: leaveRequest._id,
      details: { leaveType, numberOfDays },
    })

    res.status(201).json(leaveRequest)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Review leave request (HR/Admin only)
router.put("/:id/review", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { status, reviewComments } = req.body

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewComments,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true },
    ).populate("employee")

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "REVIEW_LEAVE_REQUEST",
      resource: "LeaveRequest",
      resourceId: leaveRequest._id,
      details: { status, employeeId: leaveRequest.employeeId },
    })

    res.json(leaveRequest)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router
