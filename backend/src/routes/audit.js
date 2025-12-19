import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import AuditLog from "../models/AuditLog.js"

const router = express.Router()

// Get audit logs (Admin/HR only)
router.get("/", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { action, resource, userId, startDate, endDate, limit = 100 } = req.query
    const query = {}

    if (action) query.action = action
    if (resource) query.resource = resource
    if (userId) query.user = userId
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const logs = await AuditLog.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))

    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
