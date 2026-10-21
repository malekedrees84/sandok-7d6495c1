import { format, differenceInMonths, addMonths, isBefore } from 'date-fns';
import { ar } from 'date-fns/locale';

export const parseMonthStr = (monthStr: string) => {
  if (!monthStr) return new Date(NaN);
  const parts = monthStr.split('-');
  if (parts.length < 2) return new Date(NaN);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return new Date(NaN);
  return new Date(year, month - 1, 1);
};

export const formatMonthStr = (date: Date) => {
  return format(date, 'yyyy-MM');
};

export const formatDisplayDate = (monthStr: string) => {
  try {
    const date = parseMonthStr(monthStr);
    if (isNaN(date.getTime())) return monthStr;
    const monthName = format(date, 'MMMM', { locale: ar });
    const year = format(date, 'yyyy');
    return `${monthName} ${year}`;
  } catch {
    return monthStr;
  }
};

export const getMemberStatus = (paidUntilStr: string) => {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const paidUntilDate = parseMonthStr(paidUntilStr);
  
  if (isNaN(paidUntilDate.getTime())) {
    return { status: 'late', text: 'غير محدد', color: 'bg-gray-100 text-gray-800' };
  }

  const diff = differenceInMonths(currentMonthStart, paidUntilDate);
  
  if (diff <= 0) return { status: 'paid', text: 'خالص', color: 'bg-green-100 text-green-800' };
  if (diff === 1) return { status: 'warning', text: 'شهر مستحق', color: 'bg-yellow-100 text-yellow-800' };
  return { status: 'late', text: `متأخر ${diff} أشهر`, color: 'bg-red-100 text-red-800' };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IL', { 
    style: 'currency', 
    currency: 'ILS',
    numberingSystem: 'latn' 
  } as Intl.NumberFormatOptions).format(amount);
};

export const downloadCSV = (data: any[], filename: string) => {
  const BOM = '\uFEFF'; 
  const headers = Object.keys(data[0]);
  const escapeCSV = (str: any) => {
    if (typeof str === 'string') return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const csvContent = BOM + [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => escapeCSV(row[fieldName])).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateMonthRange = (startDateStr: string, endDate: Date = new Date()) => {
  const start = parseMonthStr(startDateStr);
  const end = endDate;
  const months: string[] = [];
  let current = start;
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    months.push(formatMonthStr(current));
    current = addMonths(current, 1);
  }
  return months;
};

export const isMonthCovered = (monthStr: string, paidUntilStr: string) => {
  if (!paidUntilStr) return false;
  return monthStr <= paidUntilStr; 
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// اسم ملف بختام التاريخ والساعة الحالية (وقت التنزيل) — بصيغة لا تحتوي رموز ممنوعة في أسماء الملفات
export const downloadStamp = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
};

export const generatePDF = (title: string, headers: string[], rows: (string | number)[][]) => {
  const stamp = downloadStamp();
  const docTitle = `${title} - ${stamp}`;
  // Simple table view in a new window for printing
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');
      body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; text-align: right; margin: 20px; }
      h1 { text-align: center; color: #1e1b4b; margin-bottom: 15px; font-size: 24px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
      .meta { text-align: center; color: #666; font-size: 14px; margin-bottom: 25px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
      th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: right; }
      th { background-color: #4f46e5; color: white; font-weight: bold; }
      tr:nth-child(even) { background-color: #f9fafb; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { margin: 0; } }
    </style>
  `;

  const rowsHtml = rows.map(row => `
    <tr>${row.map(cell => `<td>${cell !== undefined && cell !== null && cell !== '' ? cell : '-'}</td>`).join('')}</tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>${title}</title>${styles}</head>
    <body>
      <h1>${title}</h1>
      <div class="meta">تاريخ التقرير: ${new Date().toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="footer">تم استخراج التقرير من "صندوق العائلة"</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
};

export const generateAndSharePDF = async (title: string, headers: string[], rows: (string | number)[][]) => {
  generatePDF(title, headers, rows);
};

export const downloadJSON = (data: object, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const readJSONFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
