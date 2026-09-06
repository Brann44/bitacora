import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { FileText, FileSpreadsheet, Send, CheckCircle2, AlertCircle, Mail, User, SendHorizontal } from 'lucide-react';
import { WeekData, UserSettings } from '../types';
import { generateWeeklyReportPdf } from '../lib/generatePdf';
import { generateWeeklyReportExcel } from '../lib/generateExcel';
import { generateReportHtmlEmail } from '../lib/emailTemplate';
import { useToast } from './ui/Toast';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: WeekData;
  settings: UserSettings;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  weekData,
  settings,
}) => {
  const [reportName, setReportName] = useState(settings.technician_name || '');
  const [reportEmail, setReportEmail] = useState(settings.email || '');
  const [recipientTo, setRecipientTo] = useState(settings.email || settings.gmail_user || '');
  const [recipientCc, setRecipientCc] = useState((settings.cc_emails || []).join(', '));
  const [recipientBcc, setRecipientBcc] = useState((settings.bcc_emails || []).join(', '));
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ toCount: number; ccCount: number; bccCount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setReportName(settings.technician_name || '');
    setReportEmail(settings.email || '');
    setRecipientTo(settings.email || settings.gmail_user || '');
    setRecipientCc((settings.cc_emails || []).join(', '));
    setRecipientBcc((settings.bcc_emails || []).join(', '));
  }, [settings, isOpen]);

  let totalHours = 0;
  let overtimeHours = 0;

  weekData.activities.forEach((act) => {
    let actHours = Number(act.directHours) || 0;
    if (act.subtasks && act.subtasks.length > 0) {
      actHours += act.subtasks.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    }
    totalHours += actHours;
    if (act.forcedOvertime) overtimeHours += actHours;
  });

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));
  };

  const toList = parseEmails(recipientTo);
  const ccList = parseEmails(recipientCc);
  const bccList = parseEmails(recipientBcc);

  const getEffectiveSettings = (): UserSettings => ({
    ...settings,
    technician_name: reportName.trim() || settings.technician_name,
    email: reportEmail.trim() || settings.email,
  });

  const handleDownloadPdf = () => {
    try {
      const effectiveSettings = getEffectiveSettings();
      const doc = generateWeeklyReportPdf(weekData, effectiveSettings);
      doc.save(`Bitacora_${weekData.key}.pdf`);
      toast.success('PDF descargado con los datos especificados');
    } catch (e: any) {
      toast.error('Error generando PDF: ' + e.message);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const effectiveSettings = getEffectiveSettings();
      const blob = await generateWeeklyReportExcel(weekData, effectiveSettings);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bitacora_${weekData.key}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Excel descargado con los datos especificados');
    } catch (e: any) {
      toast.error('Error generando Excel: ' + e.message);
    }
  };

  const handleSendEmail = async () => {
    const validTo = parseEmails(recipientTo);
    const validCc = parseEmails(recipientCc);
    const validBcc = parseEmails(recipientBcc);

    if (validTo.length === 0) {
      toast.error('Por favor escribe al menos un correo de destinatario válido en "Para".');
      return;
    }

    if (!settings.gmail_user || !settings.gmail_app_password) {
      toast.error('Debes configurar tu cuenta de Gmail en Ajustes antes de enviar.');
      setErrorMessage(
        '⚠️ No has configurado tu cuenta de Gmail para envíos. Por favor abre los Ajustes (⚙️) > pestaña "Gmail & Envío" y escribe tu propio correo de Gmail y contraseña de aplicación de 16 letras.'
      );
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSendSuccess(false);
    setSuccessDetails(null);

    try {
      const effectiveSettings = getEffectiveSettings();

      const pdfDoc = generateWeeklyReportPdf(weekData, effectiveSettings);
      const pdfBase64 = pdfDoc.output('datauristring').split(',')[1];
      const htmlBody = generateReportHtmlEmail(weekData, effectiveSettings);

      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: validTo,
          cc: validCc,
          bcc: validBcc,
          subject: `Reporte Semanal de Actividades — ${effectiveSettings.technician_name} (${weekData.key})`,
          html: htmlBody,
          pdfBase64,
          fileName: `Bitacora_${weekData.key}`,
          gmailUser: settings.gmail_user || undefined,
          gmailAppPassword: settings.gmail_app_password || undefined,
          senderName: effectiveSettings.technician_name,
          replyTo: effectiveSettings.email,
        }),
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error(
          `Error en respuesta del servidor (${response.status}): ${text || response.statusText}`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || `Error al enviar correo (Código ${response.status})`);
      }

      setSendSuccess(true);
      setSuccessDetails({
        toCount: validTo.length,
        ccCount: validCc.length,
        bccCount: validBcc.length,
      });
      toast.success(`¡Reporte enviado exitosamente a ${validTo.length} destinatario(s)!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo enviar el reporte por Gmail.');
      toast.error(err.message || 'Error al enviar correo');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte Semanal & Envío por Correo"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Resumen Superior */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsable</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{reportName || 'No definido'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Horas</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalHours.toFixed(2)} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Horas Extra</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{overtimeHours.toFixed(2)} hrs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Actividades</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{weekData.activities.length} registradas</span>
            </div>
          </div>
        </div>

        {/* Sección: Datos que aparecerán impresos en el Reporte (PDF/Excel) */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Remitente en el Reporte (Impreso en PDF y Excel):</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Editable para este envío</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nombre del Responsable
              </label>
              <Input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Tu nombre completo"
                className="text-xs py-1.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Correo Visible en Reporte / PDF
              </label>
              <Input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="ejemplo.trabajo@empresa.com"
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Destinatarios del Correo con Para, CC y CCO */}
        <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <SendHorizontal size={14} /> Destinatarios del Correo:
            </h4>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Varios correos separados por coma ( , )
            </span>
          </div>
          
          <div className="space-y-2.5">
            {/* Campo Para */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Para (Destinatarios principales) *
                </label>
                {toList.length > 0 && (
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
                    {toList.length} {toList.length === 1 ? 'destinatario' : 'destinatarios'}
                  </span>
                )}
              </div>
              <Input
                type="text"
                value={recipientTo}
                onChange={(e) => setRecipientTo(e.target.value)}
                placeholder="jefe@empresa.com, gerencia@empresa.com, otro@empresa.com"
                className="text-xs py-1.5"
                required
              />
            </div>

            {/* Grid CC y CCO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Campo CC */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    CC (Con Copia - visible)
                  </label>
                  {ccList.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {ccList.length} en CC
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={recipientCc}
                  onChange={(e) => setRecipientCc(e.target.value)}
                  placeholder="supervisor@empresa.com, calidad@empresa.com"
                  className="text-xs py-1.5"
                />
              </div>

              {/* Campo CCO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    CCO (Copia Oculta / BCC - privado)
                  </label>
                  {bccList.length > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                      {bccList.length} en CCO
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={recipientBcc}
                  onChange={(e) => setRecipientBcc(e.target.value)}
                  placeholder="mi_archivo@gmail.com, auditoria@empresa.com"
                  className="text-xs py-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Listado de Actividades */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Actividades incluidas ({weekData.activities.length}):
          </h4>
          <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
            {weekData.activities.map((act) => (
              <div key={act.id} className="p-2 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{act.name}</span>
                  <Badge variant="category">{act.category || 'General'}</Badge>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                  {act.days ? act.days.filter(Boolean).length : 0} días
                </span>
              </div>
            ))}
          </div>
        </div>

        {sendSuccess && successDetails && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>
              Reporte enviado exitosamente a <strong>{successDetails.toCount} destinatario(s)</strong>
              {successDetails.ccCount > 0 && `, ${successDetails.ccCount} en CC`}
              {successDetails.bccCount > 0 && `, ${successDetails.bccCount} en CCO (copia oculta)`}.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
              <FileText size={15} />
              <span>Descargar PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="gap-1.5 text-xs">
              <FileSpreadsheet size={15} />
              <span>Exportar Excel</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSendEmail}
              loading={sending}
              className="gap-1.5 text-xs shadow-md shadow-indigo-500/20"
            >
              <Send size={14} />
              <span>Enviar por Gmail</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
