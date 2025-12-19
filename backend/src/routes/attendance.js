import express from "express"
import multer from "multer"
import xlsx from "xlsx"
import { authenticate, authorize } from "../middleware/auth.js"
import Attendance from "../models/Attendance.js"
import Employee from "../models/Employee.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

function isLateArrival(inTime) {
  if (!inTime || inTime === "") return false
  const time = inTime.trim()
  const [hours, minutes] = time.split(":").map(Number)

  // If arrival is after 9:30 AM, consider it late
  if (hours > 9 || (hours === 9 && minutes > 30)) {
    return true
  }
  return false
}

function parseExcelAttendance(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" })

  const employeeAttendance = []
  let currentEmployeeCode = null
  let currentEmployeeName = null
  let statusRow = null
  let inTimeRow = null
  let outTimeRow = null
  let totalRow = null
  let dateHeaders = []

  // Find date headers row (contains date pattern like "1 St", "2 S", etc.)
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i]
    if (row && row[2] && String(row[2]).includes("St") && String(row[3]).includes("S")) {
      dateHeaders = row.slice(2) // Skip first 2 columns
      break
    }
  }

  // Parse each employee's data
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    // Check if this is employee code row
    if (row[0] === "Emp. Code:" && row[3]) {
      currentEmployeeCode = String(row[3]).trim()
      currentEmployeeName = row[12] ? String(row[12]).trim() : currentEmployeeCode
      statusRow = null
      inTimeRow = null
      outTimeRow = null
      totalRow = null
      continue
    }

    // Check for Status row
    if (row[0] === "Status" && currentEmployeeCode) {
      statusRow = row.slice(2) // Skip first 2 columns
      continue
    }

    // Check for InTime row
    if (row[0] === "InTime" && currentEmployeeCode) {
      inTimeRow = row.slice(2)
      continue
    }

    // Check for OutTime row
    if (row[0] === "OutTime" && currentEmployeeCode) {
      outTimeRow = row.slice(2)
      continue
    }

    // Check for Total row
    if (row[0] === "Total" && currentEmployeeCode) {
      totalRow = row.slice(2)

      // Process this employee's attendance
      if (statusRow && inTimeRow && outTimeRow) {
        const dailyRecords = []
        let daysPresent = 0
        let daysLeave = 0
        let halfDays = 0
        let totalWorkingDays = 0

        for (let j = 0; j < statusRow.length && j < dateHeaders.length; j++) {
          const status = statusRow[j] ? String(statusRow[j]).trim() : ""
          const inTime = inTimeRow[j] ? String(inTimeRow[j]).trim() : ""
          const outTime = outTimeRow[j] ? String(outTimeRow[j]).trim() : ""
          const total = totalRow[j] ? String(totalRow[j]).trim() : "00:00"
          const dateHeader = dateHeaders[j] ? String(dateHeaders[j]).trim() : ""

          if (!status || status === "") continue

          const isLate = isLateArrival(inTime)
          let finalStatus = status

          // Count working days (exclude WO - week off)
          if (status !== "WO") {
            totalWorkingDays++
          }

          // Handle present status
          if (status === "P" || status === "WOP") {
            if (isLate) {
              finalStatus = "HD" // Half Day due to late arrival
              halfDays++
            } else {
              daysPresent++
            }
          } else if (status === "A") {
            daysLeave++
          }

          dailyRecords.push({
            date: dateHeader,
            status: finalStatus,
            inTime,
            outTime,
            isLate,
            totalHours: total,
          })
        }

        employeeAttendance.push({
          employeeId: currentEmployeeCode,
          employeeName: currentEmployeeName,
          daysPresent,
          daysLeave,
          halfDays,
          totalDays: totalWorkingDays,
          dailyRecords,
        })
      }

      currentEmployeeCode = null
    }
  }

  return employeeAttendance
}

router.post("/upload-excel", authenticate, authorize("admin", "hr"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { monthYear } = req.body
    if (!monthYear) {
      return res.status(400).json({ message: "Month/Year is required" })
    }

    // Parse Excel file
    const attendanceData = parseExcelAttendance(req.file.buffer)

    const results = []
    for (const record of attendanceData) {
      const employee = await Employee.findOne({ employeeId: record.employeeId })
      if (!employee) {
        results.push({
          employeeId: record.employeeId,
          status: "failed",
          reason: "Employee not found",
        })
        continue
      }

      try {
        const attendance = await Attendance.findOneAndUpdate(
          { employee: employee._id, monthYear },
          {
            employeeId: record.employeeId,
            employee: employee._id,
            monthYear,
            daysPresent: record.daysPresent,
            daysLeave: record.daysLeave,
            halfDays: record.halfDays,
            totalDays: record.totalDays,
            dailyRecords: record.dailyRecords,
          },
          { upsert: true, new: true },
        )
        results.push({
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          status: "success",
          daysPresent: record.daysPresent,
          daysLeave: record.daysLeave,
          halfDays: record.halfDays,
        })
      } catch (error) {
        results.push({
          employeeId: record.employeeId,
          status: "failed",
          reason: error.message,
        })
      }
    }

    res.json({
      message: "Attendance uploaded successfully",
      results,
      totalProcessed: results.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Upload attendance CSV (keeping for backward compatibility)
router.post("/upload", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { attendanceData, monthYear } = req.body

    if (!Array.isArray(attendanceData) || !monthYear) {
      return res.status(400).json({ message: "Invalid data format" })
    }

    const results = []
    for (const record of attendanceData) {
      const employee = await Employee.findOne({ employeeId: record.employeeId })
      if (!employee) {
        results.push({ employeeId: record.employeeId, status: "failed", reason: "Employee not found" })
        continue
      }

      try {
        const attendance = await Attendance.findOneAndUpdate(
          { employee: employee._id, monthYear },
          {
            employeeId: record.employeeId,
            employee: employee._id,
            monthYear,
            daysPresent: record.daysPresent,
            daysLeave: record.daysLeave,
            halfDays: record.halfDays || 0,
            totalDays: record.totalDays,
          },
          { upsert: true, new: true },
        )
        results.push({ employeeId: record.employeeId, status: "success" })
      } catch (error) {
        results.push({ employeeId: record.employeeId, status: "failed", reason: error.message })
      }
    }

    res.json({ message: "Attendance uploaded", results })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get attendance records
router.get("/", authenticate, async (req, res) => {
  try {
    const { monthYear, employeeId, status } = req.query
    const query = {}

    if (monthYear) query.monthYear = monthYear
    if (employeeId) query.employeeId = employeeId
    if (status) query.verifiedStatus = status

    const attendance = await Attendance.find(query).populate("employee").sort({ uploadedAt: -1 })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Verify attendance
router.put("/:id/verify", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { verifiedStatus: "verified", verifiedBy: req.user.id },
      { new: true },
    )
    if (!attendance) return res.status(404).json({ message: "Attendance not found" })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
