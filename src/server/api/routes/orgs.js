const express = require("express");
const db = require("../db/db_connection");
const orgData = require("../db/orgs");
const users = require("../db/users");
const router = express.Router();

// GET /orgs/by-name/:org_name
router.get("/by-name/:org_name", async (req, res) => {
  try {d
    const { org_name } = req.params;
    const [rows] = await db.query(
      "SELECT org_id FROM orgs WHERE org_name = ?",
      [org_name]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json({ org_id: rows[0].org_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /orgs/:id
router.get("/:id", async (req, res) => {
  try {
    // orgData.get_org sends the JSON or 404 directly
    await orgData.get_org(req.params.id, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /orgs/:id/name
router.get("/:id/name", async (req, res) => {
  const orgId = req.params.id;
  try {
    const [rows] = await db.query(
      "SELECT org_name FROM orgs WHERE org_id = ?",
      [orgId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json({ org_name: rows[0].org_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /orgs
// body: { org_name, u_email }
router.post("/", async (req, res) => {
  const { org_name, u_email } = req.body;
  if (!org_name || !u_email) {
    return res.status(400).json({ error: "org_name and u_email are required" });
  }
  try {
    const [insert] = await db.query(
      "INSERT INTO orgs (org_name) VALUES (?)",
      [org_name]
    );
    const newOrgId = insert.insertId;

    const [upd] = await db.query(
      "UPDATE users SET org_id = ?, u_role = 'admin' WHERE email = ?",
      [newOrgId, u_email]
    );
    if (!upd.affectedRows) {
      // rollback if user not found
      await db.query("DELETE FROM orgs WHERE org_id = ?", [newOrgId]);
      return res.status(404).json({ error: `User not found: ${u_email}` });
    }

    const [[adminUser]] = await db.query(
      "SELECT u_id, u_name, email, u_role, org_id, group_id FROM users WHERE email = ?",
      [u_email]
    );
    res.status(201).json({ org_id: newOrgId, org_name, admin_user: adminUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /orgs/:id/groups
// body: { group_name, u_email }
router.post("/:id/groups", async (req, res) => {
  const orgId = req.params.id;
  const { group_name, u_email } = req.body;
  if (!group_name || !u_email) {
    return res.status(400).json({ error: "group_name and u_email are required" });
  }
  if (!(await orgData.org_exist(orgId))) {
    return res.status(404).json({ error: `No org found with id ${orgId}` });
  }

  try {
    const [users] = await db.query(
      "SELECT u_role FROM users WHERE email = ? AND org_id = ?",
      [u_email, orgId]
    );
    if (!users.length || users[0].u_role !== "admin") {
      return res.status(403).json({ error: "Only admins can create groups" });
    }

    const [insert] = await db.query(
      "INSERT INTO grp (group_name, org_id) VALUES (?, ?)",
      [group_name, orgId]
    );
    const newGroupId = insert.insertId;
    res.status(201).json({ group_id: newGroupId, group_name, org_id: parseInt(orgId, 10) });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Group name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /orgs/:id/leave
// body: { u_email }
router.post("/:id/leave", async (req, res) => {
  const orgId = req.params.id;
  const { u_email } = req.body;
  if (!u_email) {
    return res.status(400).json({ error: "u_email is required" });
  }
  if (!(await orgData.org_exist(orgId))) {
    return res.status(404).json({ error: `No org found with id ${orgId}` });
  }
  try {
    const [upd] = await db.query(
      "UPDATE users SET org_id = 1000001, u_role = 'maintainer', group_id = 3000001 WHERE email = ? AND org_id = ?",
      [u_email, orgId]
    );
    
    if (!upd.affectedRows) {
      return res.status(404).json({ error: `User not found in org: ${u_email}` });
    }

    orgData.delete_org_empty(orgId);
    res.json({ success: true, org_id: 1000001, u_role: "maintainer" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /orgs/:id/display
router.get("/:id/display", async (req, res) => {
  const id = req.params.id;
  if (!(await orgData.org_exist(id))) {
    return res.status(404).json({ error: `No org found with id ${id}` });
  }
  try {
    const users = await orgData.org_users(id);
    const vms = await orgData.org_vm(id);
    const grps = await orgData.org_groups(id);
    res.json({ users, groups: grps, vms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/add-user', async (req, res) => {
    const orgId = req.params.id;
    const { u_email, admin_email } = req.body;
  
    if (!u_email || !admin_email) {
      return res.status(400).json({ error: 'u_email and admin_email required' });
    }
  
    try {
      // 1) check org exists
      const [orgRows] = await db.query('SELECT * FROM orgs WHERE org_id = ?', [orgId]);
      if (orgRows.length === 0) {
        return res.status(404).json({ error: `Org ${orgId} not found` });
      }
  
      // 2) verify caller is admin of that org
      if(users.verifyAdmin(admin_email) === false) {
        return res.status(403).json({ error: 'Only admins can invite members' });
      }
  
      // 3) check target user exists
      if(users.userExist(u_email) === false) {
        return res.status(404).json({ error: `User ${u_email} not found` });
      }
  
      // 4) update their org_id
      await db.query('UPDATE users SET org_id = ? WHERE email = ?', [orgId, u_email]);
  
      // 5) return updated user
      const [updated] = await db.query(
        'SELECT u_id, u_name, email, u_role, org_id, group_id FROM users WHERE email = ?',
        [u_email]
      );
      res.json({ success: true, user: updated[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;
