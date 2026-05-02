import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function sendVerificationEmail(
  email: string,
  verifyCode: string
) {
  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    await transporter.verify();
    console.log("Transport verified");

    await transporter.sendMail({
      from: `"Anonymous Messaging" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1>${verifyCode}</h1>
          <p>This OTP expires in 1 hour.</p>
        </div>
      `,
    });

    return { status: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { status: false };
  }
}

