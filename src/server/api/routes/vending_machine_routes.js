const express = require("express");
const router = express.Router();
const db = require("../db/db_connection"); // Import database connection

// Get all vending machines
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM vending_machines");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get vending machine by ID
router.get("/:id", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM vending_machines WHERE vm_id = ?", [req.params.id]);
        if (results.length === 0) {
            res.status(404).json({ error: "Vending machine not found" });
        } else {
            res.json(results[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new vending machine
router.post("/", async (req, res) => {
    try {
        const { vm_id, vm_name, vm_row_count, vm_column_count, vm_mode } = req.body;

        await db.query(
            `INSERT INTO vending_machines 
            (vm_id, vm_name, vm_row_count, vm_column_count, vm_mode, vm_last_unupdated_operation) 
            VALUES (?, ?, ?, ?, ?, NULL)`, 
            [vm_id, vm_name, vm_row_count, vm_column_count, vm_mode]
        );

        res.json({
            vm_id,
            vm_name,
            vm_row_count,
            vm_column_count,
            vm_mode,
            vm_last_unupdated_operation: null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;