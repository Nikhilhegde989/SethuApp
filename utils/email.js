const transporter = require('../config/nodemailer');

/**
 * Send an email with the given details.
 * @param {string} subject - Subject of the email.
 * @param {string} body - Body content of the email (plain text or HTML).
 * @param {string} sendTo - Recipient email address.
 * @returns {Promise<object>} Returns a result object with success status and message.
 */
const sendEmail = async (subject, body, sendTo) => {
  try {
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sendTo,
      subject: subject,
      html: body,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    return {
      success: true,
      message: `Email sent successfully to ${sendTo}`,
    };
  } catch (error) {
    console.error('Error sending email:', error.message);

    // Return failure response
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
    };
  }
};

module.exports = {sendEmail};
