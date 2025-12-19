import mongoose from "mongoose"

const attendanceSchema = new mongoose.Schema({
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
  totalDays: {
    type: Number,
    required: true,
  },
  dailyRecords: [
    {
      date: String,
      status: String, // P, A, WO, WOP, HD (Half Day)
      inTime: String,
      outTime: String,
      isLate: Boolean,
      totalHours: String,
    },
  ],
  verifiedStatus: {
    type: String,
    enum: ["pending", "verified"],
    default: "pending",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
})

// Compound index for unique attendance per employee per month
attendanceSchema.index({ employee: 1, monthYear: 1 }, { unique: true })

export default mongoose.model("Attendance", attendanceSchema)
