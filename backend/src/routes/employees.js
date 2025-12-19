import express from "express"
import { authenticate, authorize } from "../middleware/auth.js"
import Employee from "../models/Employee.js"
import User from "../models/User.js"
import multer from "multer"
import path from "path"

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/documents/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (extname) {
      return cb(null, true)
    }
    cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, PNG files allowed"))
  },
})

// Get all employees
router.get("/", authenticate, async (req, res) => {
  try {
    const { department, status, search } = req.query
    const query = {}

    if (department) query.department = department
    if (status) query.status = status
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ]
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 })
    res.json(employees)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get single employee
router.get("/:id", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("userId", "email role")
    if (!employee) return res.status(404).json({ message: "Employee not found" })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const { username, password, ...employeeData } = req.body

    // Create user account for employee login
    let userId = null
    if (username && password) {
      const existingUser = await User.findOne({ email: username })
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" })
      }

      const user = new User({
        name: employeeData.name,
        email: username,
        password,
        role: "employee",
      })
      await user.save()
      userId = user._id
    }

    const employee = new Employee({
      ...employeeData,
      userId,
    })
    await employee.save()

    res.status(201).json(employee)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update employee
router.put("/:id", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    )
    if (!employee) return res.status(404).json({ message: "Employee not found" })
    res.json(employee)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete employee
router.delete("/:id", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id)
    if (!employee) return res.status(404).json({ message: "Employee not found" })

    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId)
    }

    res.json({ message: "Employee deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/:id/documents", authenticate, authorize("admin", "hr"), upload.single("document"), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) return res.status(404).json({ message: "Employee not found" })

    const document = {
      name: req.body.name || req.file.originalname,
      type: path.extname(req.file.originalname),
      url: `/uploads/documents/${req.file.filename}`,
    }

    employee.documents.push(document)
    await employee.save()

    res.json(employee)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.delete("/:id/documents/:docId", authenticate, authorize("admin", "hr"), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) return res.status(404).json({ message: "Employee not found" })

    employee.documents = employee.documents.filter((doc) => doc._id.toString() !== req.params.docId)
    await employee.save()

    res.json(employee)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router
