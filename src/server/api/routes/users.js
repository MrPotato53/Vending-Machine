const express = require("express");
const argon = require("argon2");
const crypto = require("crypto");
const router = express.Router({ mergeParams: true });
const db = require("../db/db_connection");
const users = require("../db/users");

// Create new user
router.post("/new", async (req, res) => {
  try {
    const { u_name, email, u_role, org_id, group_id, password } = req.body;
    if (!u_name || !email || !password) {
      return res.status(400).json({ error: "u_name, email and password are required" });
    }
    if (await users.userExist(u_name)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await argon.hash(password, { type: argon.argon2id });
    const role = u_role || "maintainer";
    const org = org_id || 1000001;
    const grp = group_id || 3000001;
    await db.query(
      `INSERT INTO users (u_name, email, u_role, org_id, group_id, hash_p) VALUES (?, ?, ?, ?, ?, ?)`,
      [u_name, email, role, org, grp, hashedPassword]
    );
    res.json({ u_name, email, u_role: role, org_id: org, group_id: grp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { u_email, password } = req.body;
    if (!u_email || !password) return res.status(400).json({ error: "Email and password required" });
    if (!(await users.userExist(u_email))) return res.status(400).json({ error: "User does not exist" });
    const valid = await users.userVerify(password, u_email);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// Delete user
router.delete("/delete", async (req, res) => {
  try {
    const { u_email, password } = req.body;
    if (!u_email || !password) return res.status(400).json({ error: "Email and password required" });
    if (!(await users.userExist(u_email))) return res.status(400).json({ error: "User does not exist" });
    if (!(await users.userVerify(password, u_email))) return res.status(401).json({ error: "Invalid credentials" });
    await db.query("DELETE FROM users WHERE email = ?", [u_email]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by email
router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email;
    if (!(await users.userExist(email))) return res.status(400).json({ error: "User does not exist" });
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Generate OTP
router.get("/:u_email/otp", async (req, res) => {
  try {
    const email = req.params.u_email;
    if (!(await users.userExist(email))) return res.status(400).json({ error: "User does not exist" });
    const otp = crypto.randomInt(100000, 999999);
    res.json({ otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update arbitrary user fields
router.patch("/:u_email/update", async (req, res) => {
  const email = req.params.u_email;
  const { users_changes } = req.body;
  return users.updateUsers(users_changes, email, res);
});

// PATCH /users/:email/group
// body: { group_id, admin_email }
router.patch("/:email/group", async (req, res) => {
  const targetEmail = req.params.email;
  const { group_id, admin_email } = req.body;
  if (!group_id || !admin_email) {
    return res.status(400).json({ error: "group_id and admin_email are required" });
  }
  try {
    // check admin role and same org
    const [[admin]] = await db.query(
      "SELECT u_role, org_id FROM users WHERE email = ?",
      [admin_email]
    );
    if (!admin || admin.u_role !== 'admin') {
      return res.status(403).json({ error: "Only admins can change group" });
    }
    // ensure target user exists and same org
    const [[userRow]] = await db.query(
      "SELECT u_id, org_id FROM users WHERE email = ?",
      [targetEmail]
    );
    if (!userRow || userRow.org_id !== admin.org_id) {
      return res.status(404).json({ error: "Target user not found in your org" });
    }
    // update group
    await db.query(
      "UPDATE users SET group_id = ? WHERE email = ?",
      [group_id, targetEmail]
    );
    const [[updated]] = await db.query(
      "SELECT u_id, u_name, email, u_role, org_id, group_id FROM users WHERE email = ?",
      [targetEmail]
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
