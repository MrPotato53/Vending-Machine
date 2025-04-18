const { verify } = require("crypto");
const db = require("./db_connection");
const users = require("./users");

const org_exist = async (org_id) => {   
    try {
        const [results] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
        return results.length > 0;
    } catch (err) {
        throw new Error("Error checking organization existence");
    }
}

const org_users = async (org_id, credentials) => {   

    if(! await users.verifyCreds(credentials)){
        return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
        const [results] = await db.query("SELECT * FROM users WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        throw new Error("Error checking organization users");
    }
}

const org_vm = async(org_id, credentials) => {

    if(! await users.verifyCreds(credentials)) return; 

    if(! await org_exist(org_id)){
        return res.status(404).json({ error: "No org found with id:", id})
    }

    try {
        const [results] = await db.query("SELECT * FROM vending_machines WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        throw new Error("Error checking organization vending machines");
    }
}

const org_groups = async(org_id, credentials) => {
    if(! await users.verifyCreds(credentials)) return; 

    if(! await org_exist(org_id)){
        return res.status(404).json({ error: "No org found with id:", id})
    }

    try {
        const [results] = await db.query("SELECT * FROM groups WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        throw new Error("Error checking organization groups");
    }
}

const get_org = async(org_id) => {
    try{
        const [results] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
        if (results.length <= 0){
            
            return res.status(404).json({ error: "No org found with id:", id})
        
        }
        else{
           res.json(results);
        }
    } catch (err) {
        return res.status(500).json({error: "Server error getting orgs."});
    }
}

const makeOrg = async (org_id, org_name, org_type) => {
    try {
        const [results] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
        if (results.length > 0) {
            return res.status(400).json({ error: "Org already exists" });
        }
        await db.query(
            `INSERT INTO orgs (org_id, org_name, org_type) VALUES (?, ?, ?)`,
            [org_id, org_name, org_type]
        );
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: "Server error creating org." });
    }
}

builtinModules.exports = {get_org, org_exist};


