const express = require("express");
const router = express.Router();
const { db } = require("../db");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

router.get("/members", async (req, res) => {
  try {
    const snapshot = await db.collection("members").get();
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load members." });
  }
});

router.get("/members/:id/bookshelf", async (req, res) => {
  try {
    const snapshot = await db.collection("received_members")
      .where("member_id", "==", req.params.id).get();

    const bookshelf = [];
    for (const doc of snapshot.docs) {
      const borrow = doc.data();
      const bookDoc = await db.collection("books").doc(borrow.book_id).get();
      const book = bookDoc.data() || {};
      bookshelf.push({
        id: doc.id,
        image_url: book.image_url || "",
        title: book.title || "",
        author: book.author || "",
        borrow_date: borrow.borrow_date,
        due_date: borrow.due_date,
      });
    }
    res.json(bookshelf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load bookshelf." });
  }
});

router.get("/members/:id/history", async (req, res) => {
  try {
    const snapshot = await db.collection("borrow_history")
      .where("member_id", "==", req.params.id).get();

    const history = [];
    for (const doc of snapshot.docs) {
      const record = doc.data();
      const bookDoc = await db.collection("books").doc(record.book_id).get();
      const book = bookDoc.data() || {};
      history.push({
        id: doc.id,
        image_url: book.image_url || "",
        title: book.title || "",
        author: book.author || "",
      });
    }
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load history." });
  }
});

module.exports = router;
