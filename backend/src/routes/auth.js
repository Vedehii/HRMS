import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // First try to find user by email (for admin/HR)
    let user = await User.findOne({ email })

    // If not found by email, try to find by username (for employees)
    if (!user) {
      user = await User.findOne({ username: email })
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    let userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    // If employee role, fetch employee details
    if (user.role === "employee" && user.employeeId) {
      const Employee = (await import("../models/Employee.js")).default
      const employee = await Employee.findOne({ employeeId: user.employeeId })
      if (employee) {
        userData = {
          ...userData,
          employeeId: employee.employeeId,
          department: employee.department,
          position: employee.position,
          baseSalary: employee.baseSalary,
          phone: employee.phone,
        }
      }
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.json({ token, user: userData })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Register (Admin only)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = new User({ name, email, password, role: role || "hr" })
    await user.save()

    res
      .status(201)
      .json({ message: "User created successfully", user: { id: user._id, email: user.email, name: user.name } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
