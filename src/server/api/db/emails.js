const emailer = require("nodemailer");

const db = require("./db_connection");
const express = require("express");
const router = express.Router({ mergeParams: true }); // Merge params from parent route

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_PASSWORD;

const sender = emailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});

const OTP = async (target) => {
    

    const otp = crypto.randomInt(100000, 999999);
        
        const email = {
            from: EMAIL,
            to: target,
            subject: "This is your one time password",
            text: `Here is your OTP: ${otp}`
    };

    sender.sendMail(email, (err, info) => {
        if(err){
            console.log(err);
            console.log("Error sending email:", err);
            return 0;
        } else {
            console.log(info);
            
        }
    });

    return otp;
};

module.exports = {OTP};