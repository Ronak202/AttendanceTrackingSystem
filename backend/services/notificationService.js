const twilio = require("twilio");
const nodemailer = require("nodemailer");
const formatPhone = (num) => {
  if (!num) return "";

  num = num.toString().trim();

  // Already correct
  if (num.startsWith("+91")) return num;

  // Starts with 91 (your DB format)
  if (num.startsWith("91")) return `+${num}`;

  // If someone stores only 10 digits
  if (num.length === 10) return `+91${num}`;

  // Fallback
  return `+${num}`;
};

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Email transporter (Gmail)
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Calculate attendance percentage
const calculateAttendancePercentage = (presentDays, totalDays) => {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
};

// Send SMS notification
const sendSMS = async (phoneNumber, message) => {
  try {
    const formattedPhone = formatPhone(phoneNumber);

    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE || "+1234567890",
      to: formattedPhone,
    });

    console.log(`[SMS] Message sent to ${formattedPhone}. SID: ${response.sid}`);
    return { success: true, messageId: response.sid };

  } catch (error) {
    console.error(`[SMS Error] Failed to send to ${phoneNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};


// Send WhatsApp notification
const sendWhatsApp = async (phoneNumber, message) => {
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.WHATSAPP_FROM || "whatsapp:+14155238886",
      to: `whatsapp:${phoneNumber}`,
    });
    console.log(`[WhatsApp] Message sent to ${phoneNumber}. SID: ${response.sid}`);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error(`[WhatsApp Error] Failed to send to ${phoneNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send Email notification
const sendEmail = async (recipientEmail, subject, htmlContent) => {
  try {
    const response = await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`[Email] Message sent to ${recipientEmail}. MessageID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Generate SMS message for low attendance
const generateSMSMessage = (studentName, percentage, threshold) => {
  return `Alert: ${studentName}'s attendance is ${percentage}% (threshold: ${threshold}%). Please contact department  for details. - Attendance Tracker`;
};

// Generate WhatsApp message for low attendance
const generateWhatsAppMessage = (
  studentName,
  studentRoll,
  percentage,
  threshold,
  classCode,
  className,
  totalDays,
  presentDays
) => {
  return (
`*📌 LOW ATTENDANCE ALERT*\n
Your ward's attendance has fallen below the required threshold.\n
*⚠️ Immediate Attention Required*\nPlease ensure regular classroom attendance.\n
*🧑‍🎓 Student Information:*
• *Name:* ${studentName}
• *Roll Number:* ${studentRoll}
• *Subject:* ${className}
• *Class:* ${classCode}

*📊 Attendance Statistics:*
• *Current Attendance:* ${percentage}%
• *Minimum Required:* ${threshold}%
• *Days Present:* ${presentDays}
• *Total Days:* ${totalDays}

Consistent attendance is essential for academic success.\nIf there are any medical or personal issues, kindly contact the department office.\n
_Attendance Tracking System (Automated Message)_`
  );
};

// Generate HTML email for low attendance
const generateEmailHTML = (studentName, studentRoll, percentage, threshold, classCode,className, totalDays, presentDays) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b6b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
        .stat-box { background: white; padding: 10px; border-radius: 5px; text-align: center; }
        .stat-label { color: #666; font-size: 12px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #ff6b6b; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .action-btn { background: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Low Attendance Alert</h2>
          <p>Attendance below minimum threshold</p>
        </div>
        
        <div class="content">
          <h3>Dear Parent/Guardian,</h3>
          
          <p>We are writing to inform you that your ward's attendance has fallen below the acceptable threshold.</p>
          
          <div class="alert">
            <strong>⚠️ Action Required</strong>
            <p>Your child's attendance requires immediate attention. Please ensure regular classroom attendance.</p>
          </div>
          
          <h4>Student Information:</h4>
          <p>
            <strong>Name:</strong> ${studentName}<br>
            <strong>Roll Number:</strong> ${studentRoll}<br>
            <strong>Subject:</strong>${className}<br>
            <strong>Class:</strong> ${classCode}
          </p>
          
          <h4>Attendance Statistics:</h4>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Current Attendance</div>
              <div class="stat-value">${percentage}%</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Minimum Required</div>
              <div class="stat-value">${threshold}%</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Days Present</div>
              <div class="stat-value">${presentDays}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Days</div>
              <div class="stat-value">${totalDays}</div>
            </div>
          </div>
          
          <p>Consistent attendance is crucial for academic success. Please ensure your child attends class regularly.</p>
          
          <p>If there are any health or personal issues affecting attendance, please contact the department office immediately.</p>
          
          <div class="footer">
            <p>This is an automated notification from the Attendance Tracking System.<br>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendEmail,
  generateSMSMessage,
  generateWhatsAppMessage,
  generateEmailHTML,
  calculateAttendancePercentage,
};
