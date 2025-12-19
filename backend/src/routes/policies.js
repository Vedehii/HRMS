import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import CompanyPolicy from "../models/CompanyPolicy.js"
import AuditLog from "../models/AuditLog.js"

const router = express.Router()

// Get all policies
router.get("/", authenticate, async (req, res) => {
  try {
    const { category } = req.query
    const query = { isActive: true }

    if (category) query.category = category

    const policies = await CompanyPolicy.find(query).populate("createdBy", "name email").sort({ createdAt: -1 })

    res.json(policies)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create policy (HR/Admin only)
router.post("/", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { title, category, content } = req.body

    const policy = new CompanyPolicy({
      title,
      category,
      content,
      createdBy: req.user.id,
    })

    await policy.save()

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "CREATE_POLICY",
      resource: "CompanyPolicy",
      resourceId: policy._id,
      details: { title, category },
    })

    res.status(201).json(policy)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update policy (HR/Admin only)
router.put("/:id", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const policy = await CompanyPolicy.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    )

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "UPDATE_POLICY",
      resource: "CompanyPolicy",
      resourceId: policy._id,
      details: { title: policy.title },
    })

    res.json(policy)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete policy (HR/Admin only)
router.delete("/:id", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    await CompanyPolicy.findByIdAndUpdate(req.params.id, { isActive: false })

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "DELETE_POLICY",
      resource: "CompanyPolicy",
      resourceId: req.params.id,
    })

    res.json({ message: "Policy deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
