require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = 5000;

// Import routes
const vendingMachinesRoutes = require("./routes/vending_machine");
const itemsRoutes = require("./routes/items");

app.use(express.json());

app.use("/vending-machines", vendingMachinesRoutes);
app.use("/items", itemsRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});