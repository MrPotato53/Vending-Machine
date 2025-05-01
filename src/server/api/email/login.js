const emailer = require("nodemailer");
const crypto = require("crypto");

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

const body = (site) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    .card {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      width: 300px;
      padding: 20px;
      text-align: center;
    }

    .card h2 {
      color: #333;
      font-size: 1.5rem;
    }

    .register-button {
      background-color: salmon;
      color: white;
      padding: 15px 30px;
      font-size: 1.2rem;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      margin-top: 20px;
    }

    .register-button:hover {
      background-color: #fa8072;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Welcome to Our Service!</h2>
    <p>We are excited to have you join us. Please register to get started.</p>
    <a href="http://cs506x19.cs.wisc.edu/" class="register-button">Register</a>
  </div>
</body>
</html>`
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

function inviteNewUser(target, orgId, groupId, role) {
    console.log(target, orgId, groupId, role);
    site ='http://cs506x19.cs.wisc.edu';

    const mailOptions = {
        from: EMAIL,
        to: target,
        subject: "Invitation to join an organization",
        text: `You have been invited to join the organization with ID ${orgId} and group ID ${groupId} \n as a ${role}. Register here to accept the invitation:http://cs506x19.cs.wisc.edu/`,
        html: body(site) // Use the fallback HTML as the main content
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