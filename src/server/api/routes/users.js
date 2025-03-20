const express = require("express");
const router = express.Router({ mergeParams: true }); // params from parents
const bcrypt = require("bcryptjs");
const db = require("../db/db_connection"); // Import database connection
const users = require("../db/users"); // Internal user functions for queries

/*
Currently all you need to create a user is ID, name, email, and password.
The rest of the fields: role & orgID will be required later once the role system has been formed. 

Security is next step but atm the password is stored plain for testing. 
*/
router.post("/new", async (req, res) => {
    try {
        const { u_id, u_name, email, u_role, org_id, password } = req.body;

        if (!u_id) {
            return res.status(400).json({ error: "No user ID provided" });
        }
        if (!u_name) {
            return res.status(400).json({ error: "No username provided" });
        }
        if (!email) {
            return res.status(400).json({ error: "No email provided" });
        }
        if (!password) {
            return res.status(400).json({ error: "No password provided" });
        }

        // Check if user already exists
        if (await users.userExist(u_id)) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set default values for optional fields
        const role = u_role || "maintainer"; // Default role
        const organization = org_id || 0; // Default organization ID

        // Insert the new user into the database
        await db.query(
            `INSERT INTO users
                (u_id, u_name, email, u_role, org_id, password)
                VALUES(?, ?, ?, ?, ?, ?)`,
            [u_id, u_name, email, role, organization, hashedPassword]
        );

        // Return the created user (excluding the password)
        res.json({
            u_id,
            u_name,
            email,
            u_role: role,
            org_id: organization,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;