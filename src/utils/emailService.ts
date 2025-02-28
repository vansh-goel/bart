import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: `${process.env.ETHEREAL_USERNAME}`,
    pass: `${process.env.ETHEREAL_PASSWORD}`,
  },
});

export const sendEmail = async (
  to: string,
  { subject, body }: { subject: string; body: string }
) => {
  const mailOptions = {
    from: `${process.env.ETHEREAL_USERNAME}`,
    to,
    subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
