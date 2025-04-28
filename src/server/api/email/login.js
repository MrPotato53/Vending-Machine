const emailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../db/db_connection");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_APP_PASSWORD;

const sender = emailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});

const body = (site, orgName, role, admin_email) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, table, td, a {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f4f4f4;
    }
    table {
      border-collapse: collapse !important;
    }
  </style>
</head>
<body style="background-color:#f4f4f4; margin:0; padding:0; width:100%; height:100%;">
  <center>
    <table border="0" cellpadding="10" cellspacing="0" width="100%">
      <tr>
        <td align="center" valign="top" style="padding:40px 10px;">
          <table border="0" cellpadding="10" cellspacing="0" width="300" style="background:white; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1); padding:20px; text-align:center;">
            <tr>
              <td style="font-family:Arial, sans-serif; color:#333333; font-size:24px; font-weight:bold;">
                Welcome to Team Nine Lives!
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px; font-family:Arial, sans-serif; color:#333333; font-size:16px;">
                You have been invited by ${admin_email} to join ${orgName} as a ${role}.
              </td>
            </tr>
            <tr>
              <td style="padding-top:10px; font-family:Arial, sans-serif; color:#333333; font-size:16px;">
                We are excited to have you join us. Please register to get started.
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;">
                <a href="${site}" style="background-color:salmon; color:white; padding:15px 30px; font-size:18px; border-radius:8px; text-decoration:none; display:inline-block;">
                  Register
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`
};

   



function email(target){

    const otp = crypto.randomInt(100000, 999999);
    
    const email = {
        from: EMAIL,
        to: target,
        subject: "Password Reset",
        text: `Here is your OTP: ${otp}`
   };

   sender.sendMail(email, (err, info) => {
       if(err){
           console.log(err);
       } else {
           console.log(info);
       }
   });

   return otp;
    
    
}

const inviteNewUser = async (target, orgID, groupId, role, admin_email) => {
    console.log(target, orgID, groupId, role, admin_email);
    site ='http://cs506x19.cs.wisc.edu';

    try{
        org = await db.query("SELECT * FROM orgs WHERE org_id = ?", [orgID]);
        orgName = org[0][0].org_name;
    }
    catch(err){
        console.log(err);
        return;
    }
    console.log(orgName);
    const mailOptions = {
        from: EMAIL,
        to: target,
        subject: "Invitation to join an organization",
        text: `You have been invited to join the organization with ID ${orgName} and group ID ${groupId} \n as a ${role}. Register here to accept the invitation:http://cs506x19.cs.wisc.edu/`,
        html: body(site, orgName, role, admin_email) // Use the fallback HTML as the main content
       // amp: body(site)
    };

    sender.sendMail(mailOptions, (err, info) => {
        if(err){
            console.log(err);
        } else {
            console.log(info);
        }
    });
}


exports.email = email;
exports.inviteNewUser = inviteNewUser;