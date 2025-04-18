const express = require("express");
const db = require("./db_connection");
const orgData = requres("../db/orgs")
const router = express.Router({ mergeParams: true }); // params from parents
const login = require("../email/login");

route.get("orgs/:id", async(req, res) => {

    const { id } = req.params;

   return orgData.get_org(id);


})

route.post("/orgs", async (req, res) => {
    try { 
        const { org_id, org_name, stripe_id } = req.body;

        if (!org_id || !org_name || !stripe_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if the organization already exists
       if(await orgData.org_exist(org_id)){
            return res.status(400).json({ error: "Organization already exists" });
        }

        // Insert the new organization into the database
        await db.query(
            `INSERT INTO orgs (org_id, org_name, stripe_id) VALUES (?, ?, ?)`,
            [org_id, org_name, stripe_id]
        );

        res.status(200).json({
            org_id,
            org_name,
            org_type,
        });
    } catch (err) {
        console.error("Error creating organization:", err);
        res.status(500).json({ error: err.message });
    }
});
