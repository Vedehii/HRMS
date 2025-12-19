import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import employeeRoutes from "./routes/employees.js"
import attendanceRoutes from "./routes/attendance.js"
import salaryRoutes from "./routes/salary.js"
import messageRoutes from "./routes/messages.js"
import leaveRoutes from "./routes/leaves.js"
import policyRoutes from "./routes/policies.js"
import performanceRoutes from "./routes/performance.js"
import auditRoutes from "./routes/audit.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, "..", "uploads", "documents")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ limit: "50mb", extended: true }))

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/salary", salaryRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/leaves", leaveRoutes)
app.use("/api/policies", policyRoutes)
app.use("/api/performance", performanceRoutes)
app.use("/api/audit", auditRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
