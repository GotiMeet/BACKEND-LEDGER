const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// async function sendRegistrationEmail(userEmail, name) {
//     const subject = "Welcome to Backend Ledger!"
//     const text = `Thank you for registering for an account on our website, ${name}. We are excited to have you on board!`
//     const html = `<p>Thank you for registering for an account on our website, ${name}. We are excited to have you on board!</p>`;
    
//     await sendEmail(userEmail, subject, text, html);
// }
async function sendRegistrationEmail(userEmail, name) {
    const subject = "Welcome to Backend Ledger!";
    
    // Clean, readable plain-text fallback
    const text = `Hello ${name},\n\nThank you for registering on Backend Ledger! We're thrilled to have you onboard.\n\nBest regards,\nThe Backend Ledger Team`;

    // Beautiful, modern HTML layout using inline CSS
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Backend Ledger</h1>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; font-size: 20px; color: #111827; font-weight: 600;">Welcome, ${name}!</h2>
            <p style="margin-bottom: 24px; color: #4b5563; font-size: 15px;">
              Thank you for creating an account. We are excited to have you on board! Backend Ledger helps you manage and track your financial transactions with speed and security.
            </p>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="http://localhost:3000" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.2s;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction successful!";
  const text = `Hello ${name},\n\nThank you for creating an account on Backend Ledger! We're thrilled to have you onboard.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Backend Ledger</h1>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; font-size: 20px; color: #111827; font-weight: 600;">Transaction successful!</h2>
            <p style="margin-bottom: 24px; color: #4b5563; font-size: 15px;">
              Dear ${name}, we are writing to confirm that a transaction of ${amount} to account ${toAccount} has been successfully completed on your Backend Ledger account.
            </p>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="http://localhost:3000" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.2s;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, reason) {
    const subject = "Transaction Failed";
    const text = `Hello ${name},\n\nYour transaction has failed. Reason: ${reason}\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Backend Ledger</h1>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; font-size: 20px; color: #111827; font-weight: 600;">Transaction Failed</h2>
            <p style="margin-bottom: 24px; color: #4b5563; font-size: 15px;">
              Dear ${name}, we regret to inform you that your transaction has failed. Reason: ${reason}\n\n
            </p>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="http://localhost:3000" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.2s;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail(userEmail, subject, text, html);
} 

async function sendRefundEmail(userEmail, name, amount, fromAccount) {
    const subject = "Refund";
    const text = `Hello ${name},\n\nYour transaction has been refunded. Reason: ${reason}\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Backend Ledger</h1>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; font-size: 20px; color: #111827; font-weight: 600;">Transaction Refunded</h2>
            <p style="margin-bottom: 24px; color: #4b5563; font-size: 15px;">
              Dear ${name}, your transaction has been refunded. Reason: ${reason}\n\n
            </p>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="http://localhost:3000" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.2s;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail(userEmail, subject, text, html);
}
module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
  sendRefundEmail
};
