import mongoose from "mongoose"

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  perDaySalary: {
    type: Number,
    calculated: true,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
  },
  documents: [
    {
      name: String,
      type: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Employee", employeeSchema)
