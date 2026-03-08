import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Syncalo <noreply@syncalo.app>";

export async function sendConflictAlert({
  to,
  orgName,
  propertyName,
  conflicts,
}: {
  to: string;
  orgName: string;
  propertyName: string;
  conflicts: { checkIn: Date; checkOut: Date; platform: string }[];
}) {
  const conflictList = conflicts
    .map(
      (c) =>
        `• ${c.platform}: ${c.checkIn.toLocaleDateString("es")} → ${c.checkOut.toLocaleDateString("es")}`
    )
    .join("\n");

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Conflicto de reservas detectado en ${propertyName}`,
    text: `Hola,\n\nSe detectaron conflictos de reservas en ${propertyName} (${orgName}):\n\n${conflictList}\n\nIngresá a tu dashboard para resolverlos.\n\nhttps://syncalo.app/calendar\n\n— Syncalo`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">⚠️ Conflicto de reservas detectado</h2>
        <p>Se detectaron reservas superpuestas en <strong>${propertyName}</strong> (${orgName}):</p>
        <ul style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 24px">
          ${conflicts
            .map(
              (c) =>
                `<li style="margin-bottom:4px"><strong>${c.platform}</strong>: ${c.checkIn.toLocaleDateString("es")} → ${c.checkOut.toLocaleDateString("es")}</li>`
            )
            .join("")}
        </ul>
        <a href="https://syncalo.app/calendar" style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
          Ver calendario
        </a>
      </div>
    `,
  });
}

export async function sendPaymentReminder({
  to,
  tenantName,
  propertyName,
  amount,
  dueDate,
  orgName,
}: {
  to: string;
  tenantName: string;
  propertyName: string;
  amount: number;
  dueDate: Date;
  orgName: string;
}) {
  const formatted = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
  }).format(amount);
  const dateStr = dueDate.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Recordatorio de pago — ${propertyName}`,
    text: `Hola ${tenantName},\n\nTe recordamos que tenés un pago pendiente de ${formatted} con vencimiento el ${dateStr} por la propiedad ${propertyName}.\n\nPor favor coordinar el pago con ${orgName}.\n\n— ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Recordatorio de pago</h2>
        <p>Hola <strong>${tenantName}</strong>,</p>
        <p>Te recordamos que tenés un pago pendiente:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0">
          <p style="margin:4px 0"><strong>Propiedad:</strong> ${propertyName}</p>
          <p style="margin:4px 0"><strong>Monto:</strong> ${formatted}</p>
          <p style="margin:4px 0"><strong>Vencimiento:</strong> ${dateStr}</p>
        </div>
        <p>Por favor coordinar el pago con <strong>${orgName}</strong>.</p>
      </div>
    `,
  });
}

export async function sendTrialEndingAlert({
  to,
  orgName,
  daysLeft,
}: {
  to: string;
  orgName: string;
  daysLeft: number;
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Tu prueba gratuita de Syncalo vence en ${daysLeft} días`,
    text: `Hola,\n\nTu período de prueba de ${orgName} vence en ${daysLeft} días.\n\nElegí un plan para continuar usando Syncalo sin interrupciones.\n\nhttps://syncalo.app/billing\n\n— Syncalo`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Tu prueba gratuita vence en ${daysLeft} días</h2>
        <p>El período de prueba de <strong>${orgName}</strong> está por vencer.</p>
        <p>Elegí un plan para continuar usando Syncalo sin interrupciones.</p>
        <a href="https://syncalo.app/billing" style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
          Ver planes
        </a>
      </div>
    `,
  });
}
