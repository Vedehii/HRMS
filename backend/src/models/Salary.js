import mongoose from "mongoose"

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  monthYear: {
    type: String,
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  daysPresent: {
    type: Number,
    required: true,
  },
  daysLeave: {
    type: Number,
    required: true,
  },
  halfDays: {
    type: Number,
    default: 0,
  },
  perDaySalary: {
    type: Number,
    required: true,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  netSalary: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
})

// Compound index for unique salary per employee per month
salarySchema.index({ employee: 1, monthYear: 1 }, { unique: true })

export default mongoose.model("Salary", salarySchema)
