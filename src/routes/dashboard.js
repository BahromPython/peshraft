const express = require("express");
const router = express.Router();
const { db } = require("../db");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// GET /admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [members, books, activeBorrows] = await Promise.all([
      db.collection("members").get(),
      db.collection("books").get(),
      db.collection("received_members").get(),
    ]);

    // Count overdue: due_date is before today
    const today = new Date().toISOString().split("T")[0];
    let overdueCount = 0;
    activeBorrows.forEach(doc => {
      if (doc.data().due_date < today) overdueCount++;
    });

    res.json({
      total_members:  members.size,
      total_books:    books.size,
      active_borrows: activeBorrows.size,
      overdue_books:  overdueCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load stats." });
  }
});

// GET /admin/stats/monthly
router.get("/stats/monthly", async (req, res) => {
  try {
    const snapshot = await db.collection("received_members").get();
    const monthlyMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.borrow_date;
      if (!date) return;
      const month = parseInt(date.split("-")[1]);
      const key = date.substring(0, 7); // "2024-01"

      if (!monthlyMap[key]) {
        monthlyMap[key] = { date: date, month, borrowed: 0, overdue: 0 };
      }
      monthlyMap[key].borrowed++;

      const today = new Date().toISOString().split("T")[0];
      if (data.due_date < today) monthlyMap[key].overdue++;
    });

    res.json(Object.values(monthlyMap).sort((a, b) => a.month - b.month));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load monthly stats." });
  }
});

// GET /admin/overdue
router.get("/overdue", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const snapshot = await db.collection("received_members").get();
    const overdueList = [];

    for (const doc of snapshot.docs) {
      const borrow = doc.data();
      if (borrow.due_date >= today) continue;

      const [memberDoc, bookDoc] = await Promise.all([
        db.collection("members").doc(borrow.member_id).get(),
        db.collection("books").doc(borrow.book_id).get(),
      ]);

      const member = memberDoc.data() || {};
      const book = bookDoc.data() || {};

      const dueDate = new Date(borrow.due_date);
      const diffDays = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24));

      overdueList.push({
        id: doc.id,
        name: member.name || "",
        phone: member.phone || "",
        book_title: book.title || "",
        borrow_date: borrow.borrow_date,
        due_date: borrow.due_date,
        days_overdue: diffDays + " days",
      });
    }

    res.json(overdueList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load overdue members." });
  }
});

module.exports = router;
