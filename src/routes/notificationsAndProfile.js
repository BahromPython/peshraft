const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { authMiddleware, mainAdminOnly } = require("../middleware/auth");

router.use(authMiddleware);

// ══════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════

router.get("/notifications", async (req, res) => {
  try {
    const snapshot = await db.collection("notifications").orderBy("created_at", "desc").get();
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load notifications." });
  }
});

router.post("/notifications", async (req, res) => {
  const { member, notification_type, notification_image_url, title, description, date, time } = req.body;
  try {
    const ref = await db.collection("notifications").add({
      member_id: notification_type === "news" ? "all_users" : member,
      notification_type,
      notification_image_url: notification_image_url || "",
      title,
      description: description || "",
      date: date || "",
      time: time || "",
      created_at: new Date().toISOString(),
    });
    res.status(201).json({ id: ref.id, title, description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create notification." });
  }
});

router.put("/notifications/:id", async (req, res) => {
  const { member, notification_type, notification_image_url, title, description, date, time } = req.body;
  try {
    await db.collection("notifications").doc(req.params.id).update({
      member_id: notification_type === "news" ? "all_users" : member,
      notification_type,
      notification_image_url: notification_image_url || "",
      title, description, date, time,
    });
    res.json({ id: req.params.id, title, description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update notification." });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    await db.collection("notifications").doc(req.params.id).delete();
    res.json({ message: "Notification deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete notification." });
  }
});

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════

router.get("/profile", async (req, res) => {
  try {
    const doc = await db.collection("admins").doc(req.admin.id).get();
    if (!doc.exists) return res.status(404).json({ message: "Profile not found." });
    const data = doc.data();
    res.json({
      id: doc.id,
      admin_image_url: data.admin_image_url || "",
      name: data.name,
      date_of_birth: data.date_of_birth || "",
      phone: data.phone || "",
      email: data.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load profile." });
  }
});

router.put("/profile", async (req, res) => {
  const { admin_image_url, name, date_of_birth, phone, email } = req.body;
  try {
    await db.collection("admins").doc(req.admin.id).update({
      admin_image_url, name, date_of_birth, phone, email,
    });
    res.json({ id: req.admin.id, name, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

router.put("/profile/password", async (req, res) => {
  const { old_password, new_password, confirm_new_password } = req.body;
  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: "New passwords do not match." });
  }
  try {
    const doc = await db.collection("admins").doc(req.admin.id).get();
    const admin = doc.data();
    const match = await bcrypt.compare(old_password, admin.password);
    if (!match) return res.status(400).json({ message: "Old password is incorrect." });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.collection("admins").doc(req.admin.id).update({ password: hashed });
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to change password." });
  }
});

// ── Main admin only ──────────────────────────

router.get("/admins", mainAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      date_of_birth: doc.data().date_of_birth || "",
      phone: doc.data().phone || "",
      email: doc.data().email,
      is_approved: doc.data().is_approved,
    }));
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load admins." });
  }
});

router.post("/admins/approve/:id", mainAdminOnly, async (req, res) => {
  try {
    await db.collection("admins").doc(req.params.id).update({ is_approved: true });
    res.json({ message: "Admin approved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve admin." });
  }
});

module.exports = router;
