import { WeekData, UserSettings, ReportColumnOptions } from '../types';

export function generateReportHtmlEmail(
  weekData: WeekData,
  settings: UserSettings,
  options?: Partial<ReportColumnOptions>
): string {
  const showHours = options?.showHours ?? true;
  const showCategory = options?.showCategory ?? true;
  const showSubtasks = options?.showSubtasks ?? true;

  let totalHours = 0;
  let totalOvertimeHours = 0;

  const activitiesRows = weekData.activities
    .map((act) => {
      let actHours = Number(act.directHours) || 0;
      if (act.subtasks && act.subtasks.length > 0) {
        actHours += act.subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
      }
      totalHours += actHours;
      if (act.forcedOvertime) totalOvertimeHours += actHours;

      const dayCells = weekData.dates
        .map((_, i) => {
          const checked = Boolean(act.days && act.days[i]);
          return `
            <td style="text-align: center; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
              ${
                checked
                  ? '<span style="display:inline-block; width:20px; height:20px; line-height:20px; background-color:#dcfce7; color:#16a34a; border-radius:4px; font-weight:bold; font-size:12px; text-align:center;">✓</span>'
                  : ''
              }
            </td>
          `;
        })
        .join('');

      let subtaskHtml = '';
      if (showSubtasks && act.subtasks && act.subtasks.length > 0) {
        const subItems = act.subtasks.map((s) => {
          const timeRange = s.startTime && s.endTime ? ` [${s.startTime} - ${s.endTime}]` : '';
          const hoursText = showHours ? ` (${Number(s.hours || 0).toFixed(2)} hrs${timeRange})` : timeRange;
          return `• ${s.description}${hoursText}`;
        });
        subtaskHtml = `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          ${subItems.join('<br>')}
        </div>`;
      }

      const categoryCell = showCategory
        ? `<td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: center;">
            <span style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 9999px; font-weight: 500;">
              ${act.category || 'General'}
            </span>
          </td>`
        : '';

      const hoursCell = showHours
        ? `<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; text-align: right; font-weight: 600;">
            ${actHours.toFixed(2)}h
          </td>`
        : '';

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 500;">
            ${act.name}
            ${subtaskHtml}
          </td>
          ${categoryCell}
          ${dayCells}
          ${hoursCell}
        </tr>
      `;
    })
    .join('');

  const metaRightColumn = showHours
    ? `<td style="text-align: right;"><strong>Total Horas:</strong> ${totalHours.toFixed(2)} hrs</td>`
    : `<td></td>`;

  const metaRightBottom = showHours
    ? `<td style="text-align: right; color: #64748b;"><strong>Horas Extra:</strong> ${totalOvertimeHours.toFixed(2)} hrs</td>`
    : `<td></td>`;

  const footerTotal = showHours
    ? `<div class="total-box">
        Total General Invertido: ${totalHours.toFixed(2)} horas
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
        .title { margin: 0; font-size: 20px; font-weight: 700; }
        .subtitle { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 24px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px; border-bottom: 2px solid #e2e8f0; }
        .total-box { margin-top: 20px; text-align: right; padding: 14px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #0f172a; font-weight: bold; }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Bitácora Semanal de Actividades</h1>
          <p class="subtitle">Semana ${weekData.key} (${weekData.startDate || ''})</p>
        </div>
        <div class="content">
          <table style="width: 100%; margin-bottom: 18px; font-size: 13px;">
            <tr>
              <td><strong>Responsable:</strong> ${settings.technician_name || 'No especificado'}</td>
              ${metaRightColumn}
            </tr>
            <tr>
              <td style="color: #64748b;"><strong>Correo:</strong> ${settings.email || 'No especificado'}</td>
              ${metaRightBottom}
            </tr>
          </table>

          <table class="table">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 12px;">Actividad</th>
                ${showCategory ? '<th>Cat</th>' : ''}
                ${weekData.dates.map((d) => `<th>${d.shortLabel}</th>`).join('')}
                ${showHours ? '<th style="text-align: right; padding: 8px 12px;">Horas</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${activitiesRows}
            </tbody>
          </table>

          ${footerTotal}
        </div>
        <div class="footer">
          Enviado automáticamente desde Bitácora Semanal Pro.
        </div>
      </div>
    </body>
    </html>
  `;
}

