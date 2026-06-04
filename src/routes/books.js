const express = require("express");
const router = express.Router();
const { db } = require("../db");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// ══════════════════════════════════════════════
// FILTERS
// ══════════════════════════════════════════════

router.get("/filters", async (req, res) => {
  try {
    const snapshot = await db.collection("filters").orderBy("filterName").get();
    const filters = snapshot.docs.map(doc => ({ id: doc.id, filterName: doc.data().filterName }));
    res.json(filters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load filters." });
  }
});

router.post("/filters", async (req, res) => {
  const { filterName } = req.body;
  if (!filterName) return res.status(400).json({ message: "filterName is required." });
  try {
    const ref = await db.collection("filters").add({ filterName });
    res.status(201).json({ id: ref.id, filterName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create filter." });
  }
});

router.put("/filters/:id", async (req, res) => {
  const { filterName } = req.body;
  try {
    await db.collection("filters").doc(req.params.id).update({ filterName });
    res.json({ id: req.params.id, filterName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update filter." });
  }
});

router.delete("/filters/:id", async (req, res) => {
  try {
    await db.collection("filters").doc(req.params.id).delete();
    res.json({ message: "Filter deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete filter." });
  }
});

// ══════════════════════════════════════════════
// BOOKS
// ══════════════════════════════════════════════

// GET /books/search?title=...&author=...&page=1&page_size=10
router.get("/search", async (req, res) => {
  const { title = "", author = "" } = req.query;
  try {
    const snapshot = await db.collection("books").get();
    let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by title or author (case insensitive)
    if (title || author) {
      books = books.filter(b =>
        b.title?.toLowerCase().includes(title.toLowerCase()) ||
        b.author?.toLowerCase().includes(author.toLowerCase())
      );
    }

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to search books." });
  }
});

router.post("/", async (req, res) => {
  const { bg_image_url, image_url, title, category, year, author, book_page, language, available_copies, description } = req.body;
  try {
    const ref = await db.collection("books").add({
      bg_image_url: bg_image_url || "",
      image_url: image_url || "",
      title, category, year: Number(year), author,
      book_page: book_page || "",
      language: language || "",
      available_copies: Number(available_copies) || 1,
      description: description || "",
      created_at: new Date().toISOString(),
    });
    res.status(201).json({ id: ref.id, title, author, category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add book." });
  }
});

router.put("/:id", async (req, res) => {
  const { bg_image_url, image_url, title, category, year, author, book_page, language, available_copies, description } = req.body;
  try {
    await db.collection("books").doc(req.params.id).update({
      bg_image_url, image_url, title, category,
      year: Number(year), author, book_page, language,
      available_copies: Number(available_copies), description,
    });
    res.json({ id: req.params.id, title, author });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update book." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.collection("books").doc(req.params.id).delete();
    res.json({ message: "Book deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete book." });
  }
});

module.exports = router;
