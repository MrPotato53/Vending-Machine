const express = require("express");
const router = express.Router();
const db = require("../db/db_connection"); // Import database connection

router.use("/:id/inventory", require("./vending_machine_items")); // Nested route

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
            (vm_id, vm_name, vm_row_count, vm_column_count, vm_mode) 
            VALUES (?, ?, ?, ?, ?)`, 
            [vm_id, vm_name, vm_row_count, vm_column_count, vm_mode]
        );

        res.json({
            vm_id,
            vm_name,
            vm_row_count,
            vm_column_count,
            vm_mode,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change mode of vending machine by ID
router.patch("/:id/mode", async (req, res) => {
    try {
        const { vm_mode } = req.body;

        if(vm_mode !== "i" && vm_mode !== "r" && vm_mode !== "t") {
            res.status(400).json({ error: "Invalid vending machine mode" });
            return;
        }

        const [results] = await db.query("UPDATE vending_machines SET vm_mode = ? WHERE vm_id = ?", [vm_mode, req.params.id]);
        if (results.affectedRows === 0) {
            res.status(404).json({ error: "Vending machine not found" });
        } else {
            res.json({ message: "Vending machine mode updated successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change name of vending machine by ID
router.patch("/:id/name", async (req, res) => {
    try {
        const { vm_name } = req.body;

        const [results] = await db.query("UPDATE vending_machines SET vm_name = ? WHERE vm_id = ?", [vm_name, req.params.id]);
        if (results.affectedRows === 0) {
            res.status(404).json({ error: "Vending machine not found" });
        } else {
            res.json({ message: "Vending machine name updated successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a vending machine by ID
router.delete("/:id", async (req, res) => {
    try {
        const [results] = await db.query("DELETE FROM vending_machines WHERE vm_id = ?", [req.params.id]);
        if (results.affectedRows === 0) {
            res.status(404).json({ error: "Vending machine not found" });
        } else {
            res.json({ message: "Vending machine deleted successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;