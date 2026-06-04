const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db");

// ────────────────────────────────────────────
// POST /auth/register  →  Sign Up
// ────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, date_of_birth, phone, email, password, confirm_password } = req.body;

  if (!name || !email || !password || !confirm_password) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    // Check if email already exists
    const existing = await db.collection("admins").where("email", "==", email).get();
    if (!existing.empty) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("admins").add({
      name,
      date_of_birth: date_of_birth || "",
      phone: phone || "",
      email,
      password: hashedPassword,
      is_main_admin: false,
      is_approved: false,
      admin_image_url: "",
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ message: "Registration successful! Wait for the main admin to approve your account." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// ────────────────────────────────────────────
// POST /auth/login  →  Sign In
// ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const snapshot = await db.collection("admins").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const adminDoc = snapshot.docs[0];
    const admin = { id: adminDoc.id, ...adminDoc.data() };

    if (!admin.is_approved) {
      return res.status(403).json({ message: "Your account has not been approved yet." });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, is_main_admin: admin.is_main_admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      access_token: token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        is_main_admin: admin.is_main_admin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// ────────────────────────────────────────────
// POST /auth/forgot-password
// ────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const snapshot = await db.collection("admins").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.json({ message: "If this email exists, a reset link has been sent." });
    }
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Reset token generated.", reset_token: resetToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ────────────────────────────────────────────
// POST /auth/reset-password
// ────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { reset_token, new_password, confirm_new_password } = req.body;

  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(new_password, 10);

    const snapshot = await db.collection("admins").where("email", "==", decoded.email).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ password: hashedPassword });
    }

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(400).json({ message: "Reset token is invalid or expired." });
  }
});

module.exports = router;
