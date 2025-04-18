const db = require("./db_connection");
const login = require("../email/login");
const argon = require("argon2");
//for furture https 
//const { Certificate } = require("crypto");

const userExist = async (u_email, res) => {
    try {
        const [results] = await db.query("SELECT * FROM users WHERE email = ?", [u_email]);
        return results.length > 0;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const userOTP = async (target, res) => {
    try {
        if (!userExist(target)) {
            return res.status(400).json({ error: "User does not exist" });
        }
        //sent otp to the user
        otp = await login.email(target);
        return otp;
    } catch (err) {
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

const verifyCreds = async (u_email) => {
    
        
    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [u_email]);
   
    if (!results || results.length === 0) {
        return false;
    }
    const user = results[0];
    if (user.u_role !== "admin") {
        return false;
    }
    return true;
};

//users: user : {u_email: "REQ", u_role: "", U_email: "", u_org: "", u_group: ""}
const updateUsers = async (users, credentials, res) => {
    console.log("users:", users);
    console.log("Updated users:");

    if (!(await verifyCreds(credentials))) {
        console.log("Credentials failed verification");
        console.log("Access use:", credentials);
        console.log("Attempted update:", JSON.stringify(users));
        return res.status(403).json({ error: "Access denied" });
    }

    const users_log = { in: [], out: [] };
    
    const length = Object.keys(users).length;
    

    for (let i = 0; i < length; i++) {
        const c_email = Object.keys(users)[i];
        //console.log("User:", c_email);
        const userData = users[c_email];
        //console.log("User data:", userData);
          
        if (!c_email) {
            users_log.out.push({
                Update: {
                    status: "Failed",
                    message: "User object is empty",
                },
            });
            continue;
        }


        // Check for required fields
        const { n_role, n_org, n_grp, n_email, n_pwd } = userData

        if (!n_role && !n_org && !n_grp && !n_email && !n_pwd) {
            users_log.out.push({
                Update: {
                    "user": user,
                    status: "Failed",
                    message: "No fields to update",
                },
            });
            continue;
        }


        users_log.in.push({
            User: { n_role, n_org, n_grp, n_email, n_pwd, c_email },
        });

        if (!(await userExist(c_email))) {
            users_log.out.push({
                Update: {
                    c_email: c_email,
                    status: "Failed",
                    message: "User does not exist",
                },
            });
            continue;
        }
        //org connection
        try {
            if (n_role) {
                await db.query("UPDATE users SET u_role = ? WHERE email = ?", [
                    n_role,
                    c_email,
                ]);
                users_log.out.push({
                    Update: {
                        c_email: c_email,
                        n_role: n_role,
                        status: "Success",
                        message: "Role updated",
                    },
                });
            }

            if (n_org) {
                n_org += 10000000;
                await db.query("UPDATE users SET org_id = ? WHERE email = ?", [
                    n_org,
                    c_email,
                ]);
                users_log.out.push({
                    Update: {
                        c_email: c_email,
                        n_org: n_org,
                        status: "Success",
                        message: "Organization updated",
                    },
                });
            }

            if (n_grp) {
                await db.query(
                    "UPDATE users SET group_id = ? WHERE email = ?",
                    [n_grp, c_email]
                );
                users_log.out.push({
                    Update: {
                        c_email: c_email,
                        n_grp: n_grp+3000000,
                        status: "Success",
                        message: "Group updated",
                    },
                });
            }

            if (n_pwd) {
                const hashedPassword = await argon.hash(n_pwd, {
                    type: argon.argon2id,
                    hashLength: 32,
                    memoryCost: 2 ** 15,
                    timeCost: 2,
                    parallelism: 1,
                });

                await db.query(
                    "UPDATE users SET hash_p = ? WHERE email = ?",
                    [hashedPassword, c_email]
                );
                users_log.out.push({
                    Update: {
                        c_email: c_email,
                        status: "Success",
                        message: "Password updated",
                    },
                });
            }

            if (n_email) {
                await db.query("UPDATE users SET email = ? WHERE email = ?", [
                    n_email,
                    c_email,
                ]);
                users_log.out.push({
                    Update: {
                        c_email: c_email,
                        n_email: n_email,
                        status: "Success",
                        message: "Email updated",
                    },
                });
            }
        } catch (err) {
            console.error("Error updating user:", err);
            users_log.out.push({
                Update: {
                    c_email: c_email,
                    status: "Failed",
                    message: "Error updating user",
                },
            });
        }
    }

    res.status(200).json({
        message: "User updated",
        log: users_log,
    });
    console.log("User updated:", users_log);
    return users_log;
};

module.exports = { userExist, userOTP, userVerify, updateUsers };

