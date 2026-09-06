import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const {
      to,
      cc,
      bcc,
      subject,
      html,
      pdfBase64,
      excelBase64,
      fileName,
      gmailUser,
      gmailAppPassword,
      senderName,
      replyTo,
    } = req.body || {};

    const user = gmailUser || process.env.GMAIL_USER;
    const pass = gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      return res.status(400).json({
        error:
          'Credenciales de Gmail no configuradas. Por favor agrega GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno de Vercel o en los Ajustes.',
      });
    }

    // Función auxiliar para procesar múltiples correos (separados por coma o punto y coma)
    const parseEmailList = (input: any): string[] => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input
          .flatMap((item) => (typeof item === 'string' ? item.split(/[,;]/) : []))
          .map((e) => e.trim())
          .filter((e) => e.length > 0 && e.includes('@'));
      }
      if (typeof input === 'string') {
        return input
          .split(/[,;]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0 && e.includes('@'));
      }
      return [];
    };

    const toList = parseEmailList(to);
    const ccList = parseEmailList(cc);
    const bccList = parseEmailList(bcc);

    if (toList.length === 0) {
      return res.status(400).json({
        error: 'Debes especificar al menos un correo de destinatario válido en "Para".',
      });
    }

    if (!subject || !html) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: subject y html son obligatorios.',
      });
    }

    // Configurar transporte SMTP oficial de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''), // Remueve espacios si se copiaron de Google
      },
    });

    // Configurar adjuntos
    const attachments: any[] = [];
    const baseName = fileName || 'Reporte_Semanal';

    if (pdfBase64) {
      attachments.push({
        filename: `${baseName}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf',
      });
    }

    if (excelBase64) {
      attachments.push({
        filename: `${baseName}.xlsx`,
        content: excelBase64,
        encoding: 'base64',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }

    // Enviar correo con remitente, destinatarios múltiples, CC y CCO (copias ocultas)
    const mailOptions: any = {
      from: `"${senderName || 'Bitácora Semanal'}" <${user}>`,
      replyTo: replyTo || user,
      to: toList.join(', '),
      subject,
      html,
      attachments,
    };

    if (ccList.length > 0) {
      mailOptions.cc = ccList.join(', ');
    }

    if (bccList.length > 0) {
      mailOptions.bcc = bccList.join(', ');
    }

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `Reporte semanal enviado exitosamente a ${toList.length} destinatario(s).`,
      recipients: {
        to: toList,
        cc: ccList,
        bcc: bccList,
      },
    });
  } catch (error: any) {
    console.error('Error enviando correo por Gmail:', error);
    return res.status(500).json({
      error: error.message || 'Error interno al enviar el correo a través de Gmail.',
    });
  }
}
