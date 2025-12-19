import mongoose from "mongoose"

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model("AuditLog", auditLogSchema)
