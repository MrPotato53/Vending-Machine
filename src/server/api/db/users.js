const db = require("./db_connection");
const login = require("../email/login");

const userExist = async (u_name, res) => {
    try{
        const [results] = await db.query("SELECT * FROM users WHERE u_name = ?", [u_name]);
        return results.length > 0;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

const userOTP = async (u_name, res) => {
    try{
        const [results] = await db.query("SELECT email FROM users WHERE u_name = ?", [u_name]);
        target = results[0].email;
        otp = await login.email(target);    
        return otp;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

module.exports = { userExist,userOTP };

