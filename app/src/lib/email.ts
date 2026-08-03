import { Resend } from "resend";
import { logger } from "@/lib/logger";

// Resend client — only initialized when RESEND_API_KEY is present
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Task Manager <noreply@taskmanager.app>";

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

interface SendInviteEmailParams {
  to: string;
  projectName: string;
  inviterName: string;
  token: string;
}

export async function sendInviteEmail({
  to,
  projectName,
  inviterName,
  token,
}: SendInviteEmailParams) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/api/invites/${token}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${inviterName} invited you to "${projectName}" on Task Manager`,
      html: `
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join the project
        <strong>${projectName}</strong>.</p>
        <p>
          <a href="${acceptUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Accept invitation
          </a>
        </p>
        <p>This invitation expires in 7 days. If you did not expect this, you can ignore this email.</p>
      `,
    });

    logger.info("Invite email sent", { to, projectName });
  } catch (err) {
    logger.error("Failed to send invite email", {
      to,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

interface SendTaskAssignedEmailParams {
  to: string;
  taskTitle: string;
  projectName: string;
  projectId: string;
}

export async function sendTaskAssignedEmail({
  to,
  taskTitle,
  projectName,
  projectId,
}: SendTaskAssignedEmailParams) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const projectUrl = `${appUrl}/projects/${projectId}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `You've been assigned: "${taskTitle}"`,
      html: `
        <p>Hi there,</p>
        <p>You have been assigned to the task <strong>${taskTitle}</strong>
        in project <strong>${projectName}</strong>.</p>
        <p>
          <a href="${projectUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            View project
          </a>
        </p>
      `,
    });

    logger.info("Task assigned email sent", { to, taskTitle });
  } catch (err) {
    logger.error("Failed to send task assigned email", {
      to,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
