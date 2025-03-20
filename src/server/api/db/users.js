const db = require("./db_connection");

const userExist = async (userID, res) => {
    try{
        const [results] = await db.query("SELECT * FROM users WHERE u_id = ?", [userID]);
        return results.length > 0;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

module.exports = { userExist };