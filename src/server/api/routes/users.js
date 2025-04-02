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
        password1 = password.toString();
        // Hash the password
        const hashedPassword = await argon.hash({
            password1, 
            salt:crypto.randomBytes(32),
            hashLength: 32,
            type: argon.argon2id,
        });
        // Check if the hashed password is valid
       console.log("hashed password: " + hashedPassword + hashedPassword.length);

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

        // TODO add add group to user and make group route under users
        // TODO add email invite to organization
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

router.post("/login", async (req, res) => {
    try {
        const { u_id, password } = req.body;

        if (!u_id) {
            return res.status(400).json({ error: "No user ID provided" });
        }
        if (!password) {
            return res.status(400).json({ error: "No password provided" });
        }

        // Check if user exists
        if (!(await users.userExist(u_id))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // Get the user's hashed password
        const [results] = await db.query(
            "SELECT password FROM users WHERE u_id = ?",
            [u_id]
        );
        const hashedPassword = results[0].password;

        // Compare the provided password with the hashed password
        if (!(await argon.verify(hashedPassword, password))) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;