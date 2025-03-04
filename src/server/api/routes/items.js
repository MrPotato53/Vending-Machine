const express = require("express");
const router = express.Router();
const db = require("../db/db_connection"); // Import database connection

// Function to create item
const createItem = async (item_name) => {
    await db.query(
        "INSERT INTO items (item_name) VALUES (?)",
        [item_name]
    );
};

// Function to get ID of item by name
const getItemIdByName = async (item_name) => {
    const [results] = await db.query("SELECT item_id FROM items WHERE item_name = ?", [item_name]);
    return results.affectedRows !== 0 ? results[0].item_id : null;
};

// Get all items
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM items");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = { router, createItem, getItemIdByName };