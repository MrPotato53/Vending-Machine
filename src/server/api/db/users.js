const db = require("./db_connection");
const login = require("../email/login");
const argon = require("argon2");


const userExist = async (u_email, res) => {
    try{
        const [results] = await db.query("SELECT * FROM users WHERE email = ?", [u_email]);
        return results.length > 0;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

const userOTP = async (target, res) => {
    try{
        if(!userExist(target)){
            return res.status(400).json({ error: "User does not exist" });
        }
        //sent otp to the user
        otp = await login.email(target);    
        return otp;
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};


const userVerify = async (password, u_email, res) => {
    
    const [results] = await db.query(
        "SELECT hash_p FROM users WHERE email = ?",
        [u_email]
    );
    
    if (!results || results.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = results[0].hash_p;
    console.log("Hashed password:", hashedPassword);
    // Verify the password with better error handling
    try {
        if (!await argon.verify(hashedPassword, password)) {
            return false;
        }
    } catch (verifyError) {
       console.error("Password verification error:", verifyError);
        return false;
    }
    return true;
};
module.exports = { userExist,userOTP,userVerify };

