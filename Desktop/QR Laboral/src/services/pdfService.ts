
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkLog, User } from '../types';

export const PDFService = {
    generateWorkReport: (logs: WorkLog[], employee: User, startDate: string, endDate: string) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Informe de Registro de Jornada', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Empleado: ${employee.full_name}`, 14, 32);
        doc.text(`DNI/NIE: ${employee.dni || 'N/A'}`, 14, 38);
        doc.text(`Periodo: ${startDate} - ${endDate}`, 14, 44);

        // Table Data
        const tableData = logs.map(log => [
            new Date(log.date).toLocaleDateString(),
            log.start_time?.slice(0, 5) || '-',
            log.end_time?.slice(0, 5) || '-',
            log.total_hours?.toFixed(2) + 'h' || '0h',
            log.breaks?.length ? `${log.breaks.length} pausas` : 'No',
            log.status === 'FINISHED' ? 'Completado' : 'En curso'
        ]);

        // Generate Table
        autoTable(doc, {
            head: [['Fecha', 'Entrada', 'Salida', 'Total', 'Pausas', 'Estado']],
            body: tableData,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('Firma del Empleado:', 14, finalY);
        doc.line(14, finalY + 10, 80, finalY + 10);

        doc.text('Firma de la Empresa:', 120, finalY);
        doc.line(120, finalY + 10, 186, finalY + 10);

        // Save
        doc.save(`Registro_Jornada_${employee.full_name.replace(/\s+/g, '_')}_${startDate}.pdf`);
    }
};
