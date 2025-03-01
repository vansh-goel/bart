import { Resend } from "resend";

const resend = new Resend(`${process.env.RESEND}`);

export const sendEmail = async (
  to: string,
  { subject, html }: { subject: string; html: string }
) => {
  try {
    const response = await resend.emails.send({
      from: `${process.env.RESEND_DOMAIN}`,
      to: [to],
      subject,
      html,
    });

    // Check if response and data are present
    if (response && response.data) {
      console.log("Email sent successfully", response.data);
    } else {
      console.warn("Email sent, but no data returned:", response);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
