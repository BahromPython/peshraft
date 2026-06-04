require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth",  require("./src/routes/auth"));
app.use("/admin", require("./src/routes/dashboard"));
app.use("/books", require("./src/routes/books"));
app.use("/admin", require("./src/routes/members"));
app.use("/admin", require("./src/routes/borrowing"));
app.use("/admin", require("./src/routes/notificationsAndProfile"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
