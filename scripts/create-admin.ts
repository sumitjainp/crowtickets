import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"

async function createAdminUser() {
  const email = "admin@escrow.com"
  const password = "admin123" // Change this to a secure password
  const name = "Admin User"

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("Admin user already exists!")
      console.log("Email:", email)
      console.log("Updating role to ADMIN...")

      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      })

      console.log("✅ User updated to ADMIN role!")
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "ADMIN",
      },
    })

    console.log("✅ Admin user created successfully!")
    console.log("\nLogin credentials:")
    console.log("Email:", email)
    console.log("Password:", password)
    console.log("\n⚠️  Please change the password after first login!")
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
