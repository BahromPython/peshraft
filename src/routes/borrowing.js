const express = require("express");
const router = express.Router();
const { db } = require("../db");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// ══════════════════════════════════════════════
// RECEIVED MEMBERS
// ══════════════════════════════════════════════

router.get("/received-members", async (req, res) => {
  try {
    const snapshot = await db.collection("received_members").get();
    const list = [];
    for (const doc of snapshot.docs) {
      const borrow = doc.data();
      const [memberDoc, bookDoc] = await Promise.all([
        db.collection("members").doc(borrow.member_id).get(),
        db.collection("books").doc(borrow.book_id).get(),
      ]);
      const member = memberDoc.data() || {};
      const book = bookDoc.data() || {};
      list.push({
        id: doc.id,
        member_image_url: member.member_image_url || "",
        borrower_name: member.name || "",
        borrow_date: borrow.borrow_date,
        due_date: borrow.due_date,
        phone: member.phone || "",
        email: member.email || "",
        book_title: book.title || "",
        author: book.author || "",
      });
    }
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load received members." });
  }
});

router.delete("/received-members/:id", async (req, res) => {
  try {
    await db.collection("received_members").doc(req.params.id).delete();
    res.json({ message: "Record deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete record." });
  }
});

// ══════════════════════════════════════════════
// RECEIVE REQUESTS (borrow requests)
// ══════════════════════════════════════════════

router.get("/receive-requests", async (req, res) => {
  try {
    const snapshot = await db.collection("receive_requests").get();
    const list = [];
    for (const doc of snapshot.docs) {
      const request = doc.data();
      const [memberDoc, bookDoc] = await Promise.all([
        db.collection("members").doc(request.member_id).get(),
        db.collection("books").doc(request.book_id).get(),
      ]);
      const member = memberDoc.data() || {};
      const book = bookDoc.data() || {};
      list.push({
        id: doc.id,
        member_image_url: member.member_image_url || "",
        receiver_name: member.name || "",
        phone: member.phone || "",
        email: member.email || "",
        request_date: request.request_date,
        borrow_date: request.borrow_date,
        due_date: request.due_date,
        book_title: book.title || "",
        author: book.author || "",
      });
    }
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load requests." });
  }
});

// Accept borrow request: delete request + create received_member
router.post("/receive-requests/accept/:id", async (req, res) => {
  try {
    const requestDoc = await db.collection("receive_requests").doc(req.params.id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ message: "Request not found." });
    }
    const request = requestDoc.data();

    // Add to received_members
    await db.collection("received_members").add({
      member_id: request.member_id,
      book_id: request.book_id,
      borrow_date: request.borrow_date,
      due_date: request.due_date,
      created_at: new Date().toISOString(),
    });

    // Delete the request
    await db.collection("receive_requests").doc(req.params.id).delete();

    res.json({ message: "Request accepted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept request." });
  }
});

router.delete("/receive-requests/:id", async (req, res) => {
  try {
    await db.collection("receive_requests").doc(req.params.id).delete();
    res.json({ message: "Request deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete request." });
  }
});

// ══════════════════════════════════════════════
// RETURN REQUESTS
// ══════════════════════════════════════════════

router.get("/return-requests", async (req, res) => {
  try {
    const snapshot = await db.collection("return_requests").get();
    const list = [];
    for (const doc of snapshot.docs) {
      const request = doc.data();
      const [memberDoc, borrowDoc] = await Promise.all([
        db.collection("members").doc(request.member_id).get(),
        db.collection("received_members").doc(request.received_member_id).get(),
      ]);
      const member = memberDoc.data() || {};
      const borrow = borrowDoc.data() || {};
      const bookDoc = borrow.book_id ? await db.collection("books").doc(borrow.book_id).get() : null;
      const book = bookDoc?.data() || {};
      list.push({
        id: doc.id,
        member_image_url: member.member_image_url || "",
        returner_name: member.name || "",
        phone: member.phone || "",
        email: member.email || "",
        borrowed_date: borrow.borrow_date || "",
        due_date: borrow.due_date || "",
        request_date: request.request_date,
        book_title: book.title || "",
        author: book.author || "",
      });
    }
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load return requests." });
  }
});

// Accept return: delete return_request + move received_member to borrow_history
router.delete("/return-requests/accept/:id", async (req, res) => {
  try {
    const rrDoc = await db.collection("return_requests").doc(req.params.id).get();
    if (!rrDoc.exists) return res.status(404).json({ message: "Return request not found." });
    const rr = rrDoc.data();

    const borrowDoc = await db.collection("received_members").doc(rr.received_member_id).get();
    if (borrowDoc.exists) {
      const borrow = borrowDoc.data();
      // Add to history
      await db.collection("borrow_history").add({
        member_id: borrow.member_id,
        book_id: borrow.book_id,
        borrow_date: borrow.borrow_date,
        returned_date: new Date().toISOString().split("T")[0],
      });
      // Delete received_member
      await db.collection("received_members").doc(rr.received_member_id).delete();
    }

    // Delete return request
    await db.collection("return_requests").doc(req.params.id).delete();
    res.json({ message: "Return accepted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept return." });
  }
});

router.delete("/return-requests/:id", async (req, res) => {
  try {
    await db.collection("return_requests").doc(req.params.id).delete();
    res.json({ message: "Return request deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete return request." });
  }
});

module.exports = router;
