import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WeekData, UserSettings, ReportColumnOptions } from '../types';

export function generateWeeklyReportPdf(
  weekData: WeekData,
  settings: UserSettings,
  options?: Partial<ReportColumnOptions>
): jsPDF {
  const showHours = options?.showHours ?? true;
  const showCategory = options?.showCategory ?? true;
  const showSubtasks = options?.showSubtasks ?? true;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const textColor: [number, number, number] = [51, 65, 85]; // Slate 700

  // 1. Encabezado
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('BITÁCORA SEMANAL DE ACTIVIDADES', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Semana ${weekData.key}`, 14, 19);

  // 2. Información del Técnico / Periodo
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  const startY = 33;

  doc.setFont('helvetica', 'bold');
  doc.text('Responsable:', 14, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.technician_name || 'No especificado', 40, startY);

  doc.setFont('helvetica', 'bold');
  doc.text('Correo:', 14, startY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.email || 'No especificado', 40, startY + 5.5);

  const periodText =
    weekData.startDate ||
    (weekData.dates[0] && weekData.dates[weekData.dates.length - 1]
      ? `${weekData.dates[0].date} al ${weekData.dates[weekData.dates.length - 1].date}`
      : '');
  doc.setFont('helvetica', 'bold');
  doc.text('Periodo:', 130, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(periodText, 148, startY);

  // 3. Resumen de Horas (Opcional según showHours)
  let totalHours = 0;
  let totalOvertimeHours = 0;

  weekData.activities.forEach((act) => {
    let actHours = Number(act.directHours) || 0;
    if (act.subtasks && act.subtasks.length > 0) {
      actHours += act.subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    }
    totalHours += actHours;
    if (act.forcedOvertime) totalOvertimeHours += actHours;
  });

  if (showHours) {
    doc.setFont('helvetica', 'bold');
    doc.text('Total Horas:', 130, startY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalHours.toFixed(2)} hrs`, 152, startY + 5.5);
  }

  // 4. Tabla de Actividades Principal
  const tableHeaders: string[] = ['Actividad / Tarea'];
  if (showCategory) {
    tableHeaders.push('Categoría');
  }
  weekData.dates.forEach((d) => {
    tableHeaders.push(d.shortLabel || d.label.substring(0, 3));
  });
  if (showHours) {
    tableHeaders.push('Horas');
  }

  const tableData = weekData.activities.map((act) => {
    let actHours = Number(act.directHours) || 0;
    if (act.subtasks && act.subtasks.length > 0) {
      actHours += act.subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    }

    const dayChecks = weekData.dates.map((_, i) => (act.days && act.days[i] ? 'CHECK' : ''));

    let activityTitle = act.name;
    if (showSubtasks && act.subtasks && act.subtasks.length > 0) {
      const subtaskLines = act.subtasks
        .map((s) => {
          const timeRange = s.startTime && s.endTime ? ` [${s.startTime} - ${s.endTime}]` : '';
          const hoursInfo = showHours ? ` (${Number(s.hours || 0).toFixed(2)} hrs${timeRange})` : timeRange;
          return `  • ${s.description}${hoursInfo}`;
        })
        .join('\n');
      activityTitle = `${act.name}\n${subtaskLines}`;
    }

    const row: string[] = [activityTitle];
    if (showCategory) {
      row.push(act.category || 'General');
    }
    row.push(...dayChecks);
    if (showHours) {
      row.push(`${actHours.toFixed(2)}h`);
    }
    return row;
  });

  // Configurar ancho de columnas dinámicamente para total = 182mm
  const categoryWidth = showCategory ? 26 : 0;
  const hoursWidth = showHours ? 16 : 0;
  const daysTotalWidth = weekData.dates.length * 14;
  const activityWidth = Math.max(50, 182 - daysTotalWidth - categoryWidth - hoursWidth);

  const columnStyles: Record<number, any> = {};
  let colIdx = 0;
  columnStyles[colIdx++] = { cellWidth: activityWidth, halign: 'left' };

  if (showCategory) {
    columnStyles[colIdx++] = { cellWidth: categoryWidth, halign: 'center' };
  }

  const dayStartCol = colIdx;
  const dayEndCol = colIdx + weekData.dates.length - 1;
  for (let i = 0; i < weekData.dates.length; i++) {
    columnStyles[colIdx++] = { cellWidth: 14, halign: 'center' };
  }

  if (showHours) {
    columnStyles[colIdx++] = { cellWidth: hoursWidth, halign: 'center', fontStyle: 'bold' };
  }

  autoTable(doc, {
    startY: startY + 11,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index >= dayStartCol && data.column.index <= dayEndCol) {
        if (data.cell.raw === 'CHECK') {
          const { x, y, width, height } = data.cell;
          const cx = x + width / 2;
          const cy = y + height / 2;

          // Badge contenedor verde suave
          doc.setFillColor(236, 253, 245); // Emerald 50
          doc.setDrawColor(167, 243, 208); // Emerald 200
          doc.setLineWidth(0.2);
          doc.roundedRect(cx - 3, cy - 3, 6, 6, 1.2, 1.2, 'FD');

          // Trazo del checkmark verde esmeralda
          doc.setDrawColor(16, 185, 129); // Emerald 500
          doc.setLineWidth(0.65);
          doc.line(cx - 1.8, cy, cx - 0.4, cy + 1.4);
          doc.line(cx - 0.4, cy + 1.4, cx + 1.8, cy - 1.3);
        }
      }
    },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index >= dayStartCol && data.column.index <= dayEndCol) {
        if (data.cell.raw === 'CHECK') {
          data.cell.text = [];
        }
      }
    },
    foot: showHours
      ? [
          [
            'Total General',
            ...(showCategory ? [''] : []),
            ...weekData.dates.map(() => ''),
            `${totalHours.toFixed(2)}h`,
          ],
        ]
      : undefined,
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generado por Bitácora Semanal Pro — Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

