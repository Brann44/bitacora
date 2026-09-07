import ExcelJS from 'exceljs';
import { WeekData, UserSettings, ReportColumnOptions } from '../types';

export async function generateWeeklyReportExcel(
  weekData: WeekData,
  settings: UserSettings,
  options?: Partial<ReportColumnOptions>
): Promise<Blob> {
  const showHours = options?.showHours ?? true;
  const showCategory = options?.showCategory ?? true;
  const showSubtasks = options?.showSubtasks ?? true;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.technician_name || 'Bitácora Pro';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Semana ${weekData.key}`);

  // Configurar columnas dinámicamente
  const columns: { header: string; key: string; width: number }[] = [
    { header: 'Actividad / Tarea', key: 'activity', width: 45 },
  ];

  if (showCategory) {
    columns.push({ header: 'Categoría', key: 'category', width: 18 });
  }

  weekData.dates.forEach((d) => {
    columns.push({ header: `${d.shortLabel} (${d.formatted || d.date})`, key: d.date, width: 14 });
  });

  if (showHours) {
    columns.push({ header: 'Horas Totales', key: 'hours', width: 16 });
    columns.push({ header: 'Tiempo Extra', key: 'overtime', width: 14 });
  }

  worksheet.columns = columns;

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let totalHours = 0;

  weekData.activities.forEach((act) => {
    let actHours = Number(act.directHours) || 0;
    const subtasks = act.subtasks || [];
    if (subtasks.length > 0) {
      actHours += subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    }
    totalHours += actHours;

    // Fila de la actividad principal
    const rowData: Record<string, any> = {
      activity: act.name,
    };

    if (showCategory) {
      rowData.category = act.category || 'General';
    }

    if (showHours) {
      rowData.hours = `${actHours.toFixed(2)} hrs`;
      rowData.overtime = act.forcedOvertime ? 'SÍ' : 'NO';
    }

    weekData.dates.forEach((day, idx) => {
      rowData[day.date] = act.days && act.days[idx] ? '✓' : '';
    });

    const row = worksheet.addRow(rowData);
    row.font = { bold: true };
    row.alignment = { vertical: 'middle' };

    // Estilo centrado y verde para las casillas marcadas
    const dayStartColNumber = showCategory ? 3 : 2;
    weekData.dates.forEach((day, idx) => {
      const cell = row.getCell(dayStartColNumber + idx);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (act.days && act.days[idx]) {
        cell.font = { bold: true, color: { argb: 'FF16A34A' } };
      }
    });

    // Filas para cada subtarea
    if (showSubtasks && subtasks.length > 0) {
      subtasks.forEach((st) => {
        const timeRange = st.startTime && st.endTime ? ` (${st.startTime} - ${st.endTime})` : '';
        const subRowData: Record<string, any> = {
          activity: `   └─ ${st.description}${timeRange}`,
        };
        if (showCategory) {
          subRowData.category = '';
        }
        if (showHours) {
          subRowData.hours = `${Number(st.hours || 0).toFixed(2)} hrs`;
          subRowData.overtime = '';
        }
        weekData.dates.forEach((day) => {
          subRowData[day.date] = '';
        });
        const subRow = worksheet.addRow(subRowData);
        subRow.font = { italic: true, color: { argb: 'FF64748B' } };
      });
    }
  });

  if (showHours) {
    const summaryData: Record<string, any> = {
      activity: 'TOTAL GENERAL',
      hours: `${totalHours.toFixed(2)} hrs`,
      overtime: '',
    };
    if (showCategory) summaryData.category = '';
    weekData.dates.forEach((d) => {
      summaryData[d.date] = '';
    });

    const summaryRow = worksheet.addRow(summaryData);
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

