const db = require("./db_connection");
const login = require("../email/login");

const userExist = async (userID, res) => {
    try{
        const [results] = await db.query("SELECT * FROM users WHERE u_id = ?", [userID]);
        return results.length > 0;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

const userOTP = async (userID, res) => {
    try{
        const [results] = await db.query("SELECT email FROM users WHERE u_id = ?", [userID]);
        target = results[0].email;
        otp = await login.email(target);    
        return otp;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

module.exports = { userExist,userOTP };

