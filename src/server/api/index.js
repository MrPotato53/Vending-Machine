require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = 5000;

// Database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// const db = mysql.createConnection({
//   host: "db1",  // Must match the MySQL service name in docker-compose
//   port: 3306,    // MySQL’s internal port
//   user: "root",
//   password: "teamninelives",
//   database: "VendingMachineDB",
// });

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL!");
  }
});

// Connect to MySQL with retry logic
const connectWithRetry = () => {
  db.connect((err) => {
    if (err) {
      console.error("Database connection failed. Retrying in 5 seconds...", err);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("Connected to MySQL!");
    }
  });
};

connectWithRetry();

// API route to get vending machines
app.get("/vending-machines", (req, res) => {
  db.query("SELECT * FROM vending_machines", (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});