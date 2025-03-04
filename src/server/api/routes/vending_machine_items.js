const express = require("express");
const router = express.Router({ mergeParams: true }); // Merge params from parent route
const db = require("../db/db_connection"); // Import database connection
const { createItem, getItemIdByName } = require("./items");

// Get all items for a vending machine
router.get("/", async (req, res) => {
    try {
        const vendingMachineId = req.params.id; // Get vending machine ID from URL
        const [results] = await db.query("SELECT * FROM inventory_join_table WHERE IJT_vm_id = ?", [vendingMachineId]);

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add an item to a vending machine
router.post("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        const slot_name = req.params.slot_name;
        const { item_name, price, stock } = req.body;
        
        const [results] = await db.query("SELECT item_id FROM items WHERE item_name = ?", [item_name]);
        if(results.length === 0) {
            await createItem(item_name);
        }
        const item_id = await getItemIdByName(item_name);

        await db.query(
            "INSERT INTO inventory_join_table (IJT_vm_id, IJT_slot_name, IJT_item_id, IJT_price, IJT_stock) VALUES (?, ?, ?, ?, ?)",
            [vendingMachineId, slot_name, item_id, price, stock]
        );

        res.json({ 
            vm_id: vendingMachineId, 
            slot_name, 
            item_id, 
            price, 
            stock,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an item in a vending machine
router.put("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        const slotName = req.params.slot_name;
        const { item_name, price, stock } = req.body;

        const [results] = await db.query("SELECT item_id FROM items WHERE item_name = ?", [item_name]);
        if(results.length === 0) {
            await createItem(item_name);
        }
        const item_id = await getItemIdByName(item_name);

        await db.query(
            "UPDATE inventory_join_table SET IJT_item_id = ?, IJT_price = ?, IJT_stock = ? WHERE IJT_vm_id = ? AND IJT_slot_name = ?",
            [item_id, price, stock, vendingMachineId, slotName]
        );

        res.json({ 
            vm_id: vendingMachineId, 
            slot_name: slotName, 
            item_id, 
            price, 
            stock,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an item from a vending machine
// Also deletes the item from the items table if it is not used in any other vending machine
router.delete("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        const slotName = req.params.slot_name;

        const[rows] = await db.query("SELECT * FROM inventory_join_table WHERE IJT_vm_id = ? AND IJT_slot_name = ?", [vendingMachineId, slotName]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Slot not found" });
        }

        const item_id = rows[0].IJT_item_id;

        const [result] = await db.query(
            "DELETE FROM inventory_join_table WHERE IJT_vm_id = ? AND IJT_slot_name = ?",
            [vendingMachineId, slotName]
        );

        const [results] = await db.query("SELECT * FROM inventory_join_table WHERE IJT_item_id = ?", [item_id]);
        if (results.length === 0) {
            await db.query("DELETE FROM items WHERE item_id = ?", [item_id]);
        }

        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;