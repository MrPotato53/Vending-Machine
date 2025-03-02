require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = 5000;

// Database connection
const db = require("./db_connection");

// API route to get vending machines
app.get("/vending-machines", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM vending_machines");
    res.json(results);
} catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});