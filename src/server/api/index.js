require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

// Import routes
const vendingMachinesRoutes = require("./routes/vending_machine");
const itemsRoutes = require("./routes/items");
const userRoutes = require("./routes/users");
const orgRoutes = require("./routes/orgs");

const stripeRoutes = require("./routes/stripe_routes");
const { request } = require("http");

app.use(express.json());

app.use("/vending-machines", vendingMachinesRoutes);
app.use("/items", itemsRoutes);
app.use("/stripes", stripeRoutes);
app.use("/users", userRoutes);
app.use("/orgs", orgRoutes);

// Basic healthcheck endpoint for api
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});