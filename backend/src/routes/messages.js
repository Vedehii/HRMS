import express from "express"
import { authenticate } from "../middleware/auth.js"
import Message from "../models/Message.js"
import AuditLog from "../models/AuditLog.js"

const router = express.Router()

// Get messages (HR sees all employee messages, employees see their own)
router.get("/", authenticate, async (req, res) => {
  try {
    const query = {}

    if (req.user.role === "employee") {
      query.$or = [{ sender: req.user.id }, { recipient: req.user.id }]
    }

    const messages = await Message.find(query)
      .populate("sender", "name email role")
      .populate("recipient", "name email role")
      .sort({ createdAt: -1 })

    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Send message
router.post("/", authenticate, async (req, res) => {
  try {
    const { recipient, subject, content, priority } = req.body

    const message = new Message({
      sender: req.user.id,
      senderRole: req.user.role,
      recipient,
      subject,
      content,
      priority: priority || "medium",
    })

    await message.save()

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: "SEND_MESSAGE",
      resource: "Message",
      resourceId: message._id,
      details: { subject, recipient },
    })

    res.status(201).json(message)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Mark message as read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })
    res.json(message)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete message
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id)
    res.json({ message: "Message deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
