// Run this ONCE to create the default main admin account
// Command: node seed.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { db } = require("./src/db");

async function seed() {
  console.log("Creating main admin...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Check if already exists
  const existing = await db.collection("admins").where("email", "==", "admin@peshraft.com").get();
  if (!existing.empty) {
    console.log("Main admin already exists!");
    process.exit(0);
  }

  await db.collection("admins").add({
    name: "Main Admin",
    email: "admin@peshraft.com",
    password: hashedPassword,
    is_main_admin: true,
    is_approved: true,
    admin_image_url: "",
    date_of_birth: "",
    phone: "",
    created_at: new Date().toISOString(),
  });

  console.log("✅ Main admin created!");
  console.log("   Email:    admin@peshraft.com");
  console.log("   Password: admin123");
  console.log("   ⚠️  Change this password after first login!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
