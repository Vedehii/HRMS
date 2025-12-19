import mongoose from "mongoose"

const performanceRecordSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  reviewPeriod: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  strengths: {
    type: String,
  },
  areasOfImprovement: {
    type: String,
  },
  goals: {
    type: String,
  },
  comments: {
    type: String,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("PerformanceRecord", performanceRecordSchema)
