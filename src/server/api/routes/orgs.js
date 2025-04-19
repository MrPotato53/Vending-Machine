const express = require("express");
const db = require("../db/db_connection");
const orgData = require("../db/orgs");
const users = require("../db/users");
const router = express.Router({ mergeParams: true }); // params from parents

router.get("/:id", async(req, res) => {

    const { id } = req.params;

   return orgData.get_org(id, res);


});

router.post("/", async (req, res) => {
    try { 
        const { org_name } = req.body;

        if ( !org_name ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

      

        // Insert the new organization into the database
        await db.query(
            `INSERT INTO orgs ( org_name) VALUES ( ?)`,
            [org_name]
        );

        res.status(200).json({
            org_name,
        });
    } catch (err) {
        console.error("Error creating organization:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id/display", async (req, res) => {
   
    const { id } = req.params;
    
    const{ password, u_email } = req.body;

    if(!await orgData.org_exist(id)) return res.status(404).json({ error: "No org found with id:", id});

    if(!await users.userVerify(password, u_email, res)) return; 
    
    const orgUsers = await orgData.org_users(id);
    const orgVMs = await orgData.org_vm(id);

    const orgGroups = await orgData.org_groups(id);

    const orgDisplay = {
        users: orgUsers,
        groups: orgGroups,
        vms: orgVMs
    };
    res.json(orgDisplay);
   
  
});

module.exports = router;