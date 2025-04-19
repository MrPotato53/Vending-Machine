require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const sessionMiddleware = require("./db/sessions");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(sessionMiddleware);
// Import routes
const vendingMachinesRoutes = require("./routes/vending_machine");
const itemsRoutes = require("./routes/items");
const userRoutes = require("./routes/users");
const orgRoutes = require("./routes/orgs");
const stripeRoutes = require("./routes/stripe_routes");

app.use("/vending-machines", vendingMachinesRoutes);
app.use("/items", itemsRoutes);
app.use("/stripes", stripeRoutes);
app.use("/users", userRoutes);
app.use("/orgs", orgRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});