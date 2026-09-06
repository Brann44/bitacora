import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import nodemailer from 'nodemailer';

function devApiMiddlewarePlugin(env: Record<string, string>) {
  return {
    name: 'dev-api-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/send-report', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }));
          return;
        }

        let rawBody = '';
        req.on('data', (chunk: any) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          try {
            const body = JSON.parse(rawBody || '{}');
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
            } = body;

            const user = gmailUser || env.GMAIL_USER || process.env.GMAIL_USER;
            const pass = gmailAppPassword || env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

            if (!user || !pass) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  error:
                    'Credenciales de Gmail no configuradas. Por favor agrega GMAIL_USER y GMAIL_APP_PASSWORD en los Ajustes (pestaña "Gmail & Envío") o en el archivo .env.',
                })
              );
              return;
            }

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
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  error: 'Debes especificar al menos un correo de destinatario válido en "Para".',
                })
              );
              return;
            }

            if (!subject || !html) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  error: 'Faltan parámetros requeridos: subject y html son obligatorios.',
                })
              );
              return;
            }

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: user.trim(),
                pass: pass.trim().replace(/\s+/g, ''),
              },
            });

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

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                messageId: info.messageId,
                message: `Reporte semanal enviado exitosamente a ${toList.length} destinatario(s).`,
                recipients: {
                  to: toList,
                  cc: ccList,
                  bcc: bccList,
                },
              })
            );
          } catch (error: any) {
            console.error('Error enviando correo por Gmail:', error);
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: error.message || 'Error interno al enviar el correo a través de Gmail.',
              })
            );
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), devApiMiddlewarePlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
