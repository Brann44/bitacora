import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WeekData, UserSettings } from '../types';

export function generateWeeklyReportPdf(weekData: WeekData, settings: UserSettings): jsPDF {
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

  // 3. Resumen de Horas
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

  doc.setFont('helvetica', 'bold');
  doc.text('Total Horas:', 130, startY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalHours.toFixed(2)} hrs`, 152, startY + 5.5);

  // 4. Tabla de Actividades Principal
  const tableHeaders = [
    'Actividad / Tarea',
    'Categoría',
    ...weekData.dates.map((d) => d.shortLabel || d.label.substring(0, 3)),
    'Horas',
  ];

  const tableData = weekData.activities.map((act) => {
    let actHours = Number(act.directHours) || 0;
    if (act.subtasks && act.subtasks.length > 0) {
      actHours += act.subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    }

    // Si está marcado enviamos 'CHECK', de lo contrario cadena vacía ''
    const dayChecks = weekData.dates.map((_, i) => (act.days && act.days[i] ? 'CHECK' : ''));

    // Incluir subtareas formateadas
    let activityTitle = act.name;
    if (act.subtasks && act.subtasks.length > 0) {
      const subtaskLines = act.subtasks
        .map((s) => {
          const timeRange = s.startTime && s.endTime ? ` [${s.startTime} - ${s.endTime}]` : '';
          return `  • ${s.description} (${Number(s.hours || 0).toFixed(2)} hrs${timeRange})`;
        })
        .join('\n');
      activityTitle = `${act.name}\n${subtaskLines}`;
    }

    return [
      activityTitle,
      act.category || 'General',
      ...dayChecks,
      `${actHours.toFixed(2)}h`,
    ];
  });

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
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      // Dibujar check verde vectorial en las columnas de días (índices 2 a 6)
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 6) {
        if (data.cell.raw === 'CHECK') {
          const { x, y, width, height } = data.cell;
          const cx = x + width / 2;
          const cy = y + height / 2;

          // 1. Badge contenedor verde suave
          doc.setFillColor(236, 253, 245); // Emerald 50
          doc.setDrawColor(167, 243, 208); // Emerald 200
          doc.setLineWidth(0.2);
          doc.roundedRect(cx - 3, cy - 3, 6, 6, 1.2, 1.2, 'FD');

          // 2. Trazo del checkmark verde esmeralda
          doc.setDrawColor(16, 185, 129); // Emerald 500
          doc.setLineWidth(0.65);
          doc.line(cx - 1.8, cy, cx - 0.4, cy + 1.4);
          doc.line(cx - 0.4, cy + 1.4, cx + 1.8, cy - 1.3);
        }
      }
    },
    willDrawCell: (data) => {
      // Ocultar texto 'CHECK' para que solo se vea el dibujo vectorial
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 6) {
        if (data.cell.raw === 'CHECK') {
          data.cell.text = [];
        }
      }
    },
    foot: [
      [
        'Total General',
        '',
        '', '', '', '', '',
        `${totalHours.toFixed(2)}h`,
      ],
    ],
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
