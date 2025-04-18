const express = require("express");
const argon = require("argon2");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true }); // params from parents
const db = require("../db/db_connection"); // Import database connection
const users = require("../db/users"); // Internal user functions for queries
const { type } = require("os");
const { email } = require("../email/login");

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
        const { u_email, password } = req.body;

        if (!u_email) {
            return res.status(400).json({ error: "No user ID provided" });
        }
        if (!password) {
            return res.status(400).json({ error: "No password provided" });
        }

        // Check if user exists
        if (!(await users.userExist(u_email))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // Get the user's hashed password
       if(await users.userVerify(password, u_email, res)){
            res.json({ success: true });
       }
       return res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed", err });
    }
});


router.delete("/delete", async (req, res) => {
    try {
        const { u_email, password } = req.body;

        if (!u_email) {
            return res.status(400).json({ error: "No user ID provided" });
        }
        if (!password) {
            return res.status(400).json({ error: "No user ID provided" });
        }

        // Check if user exists
        if (!(await users.userExist(u_email))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        if(!await users.userVerify(password, u_email, res)){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Delete the user from the database
        await db.query("DELETE FROM users WHERE email = ?", [u_email]);

        res.json({ success: true });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ error: "Failed to delete user", err });
    }
});

router.get("/all", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM users");
        res.json(results);
    } catch (err) {
        console.error("Get all users error:", err);
        res.status(500).json({ error: "Failed to retrieve users", err });
    }
});

router.get("/:email", async (req, res) => {
    try {

        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ error: "No user email provided" });
        }

        // Check if user exists
        if (!(await users.userExist(email))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // Get the user's information
        const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);


        res.json(results[0]);
    } catch (err) {
        console.error("Get user error:", err);
        res.status(500).json({ error: "Failed to retrieve user", err });
    }
});

router.get("/:u_email/otp", async (req, res) => {
    try {
        const { u_email } = req.params;

        if (!u_email) {
            return res.status(400).json({ error: "No user ID provided" });
        }

        // Check if user exists
        if (!(await users.userExist(u_email))) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // Generate a random OTP
        const otp = crypto.randomInt(100000, 999999);

        // Send the OTP to the user's email (implementation not shown)
        // await sendOtpEmail(u_email, otp);

        res.json({ otp });
    } catch (err) {
        console.error("Generate OTP error:", err);
        res.status(500).json({ error: "Failed to generate OTP", err });
    }
});

router.patch("/:u_email/update", async (req, res) => {

    const { u_email } = req.params;
    const { users_changes} = req.body;
    return await users.updateUsers(users_changes, u_email, res);

});

module.exports = router;

