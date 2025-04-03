const express = require("express");
const argon = require("argon2");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true }); // params from parents
const db = require("../db/db_connection"); // Import database connection
const users = require("../db/users"); // Internal user functions for queries

/*Sub routes needed:    
    organization/:org_id
    vending_machines
    email invite to org home
*/

/*
Currently all you need to create a user is ID, name, email, and password.
The rest of the fields: role & orgID will be required later once the role system has been formed. 

Security is next step but atm the password is stored plain for testing. 
*/
router.post("/new", async (req, res) => {
    try {
        const { u_name, email, u_role, org_id,group_id, password } = req.body;

       
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
        if (await users.userExist(u_name)) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password - removed toString() and adjusted options
        const hashedPassword = await argon.hash(password, {
            type: argon.argon2id,
            hashLength: 32, // 32 bytes
            memoryCost: 2 ** 15, // 64MB
            timeCost: 2,
            parallelism: 1,
            raw: false
        });

        // Debug logging
        console.log("Password hash type:", typeof hashedPassword);
        console.log("Password hash length:", hashedPassword.length);

        // Set default values for optional fields
        const role = u_role || "maintainer";
        const organization = org_id || 1000001;
        const group = group_id || 3000001;

        // Insert the new user into the database
        try {
            await db.query(
                `INSERT INTO users
                    (u_name, email, u_role, org_id,group_id, hash_p)
                    VALUES(?, ?, ?, ?, ?, ?)`,
                [u_name, email, role, organization, group, hashedPassword]
            );
        } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).json({ 
                error: "Failed to create user",
                details: dbError.message 
            });
        }

        // Return the created user (excluding the password)
        res.json({
            u_name,
            email,
            u_role: role,
            org_id: organization,
            group_id: group,
        });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { u_name, password } = req.body;

        if (!U_name) {
            return res.status(400).json({ error: "No user ID provided" });
        }
        if (!password) {
            return res.status(400).json({ error: "No password provided" });
        }

        // Check if user exists
        if (!(await users.userExist(u_name))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // Get the user's hashed password
        const [results] = await db.query(
            "SELECT password FROM users WHERE u_name = ?",
            [u_name]
        );

        if (!results || results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = results[0].password;

        // Verify the password with better error handling
        try {
            const isValid = await argon.verify(hashedPassword, password);
            if (!isValid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
        } catch (verifyError) {
            console.error("Password verification error:", verifyError);
            return res.status(500).json({ error: "Authentication failed" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;