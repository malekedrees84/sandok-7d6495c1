import React from 'react';
import { Member, START_DATE, MONTHLY_FEE } from '../types';
import { formatDisplayDate, formatCurrency, generateMonthRange, isMonthCovered, parseMonthStr, formatMonthStr, generatePDF, downloadCSV } from '../utils';
import { X, FileBarChart, Download, Printer } from 'lucide-react';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  isAdmin: boolean;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose, members, isAdmin }) => {
  if (!isOpen) return null;

  const months = generateMonthRange(START_DATE).reverse();

  const reportData = months.map(monthStr => {
    const eligibleMembers = members.filter(m => {
      const joinDate = m.joinDate ? new Date(m.joinDate) : parseMonthStr(START_DATE);
      const joinMonthStr = formatMonthStr(joinDate);
      return joinMonthStr <= monthStr;
    });
    const paidMembersCount = eligibleMembers.filter(m => isMonthCovered(monthStr, m.paidUntil)).length;
    const totalCollected = paidMembersCount * MONTHLY_FEE;
    const unpaidMembersCount = eligibleMembers.length - paidMembersCount;
    return { monthStr, displayDate: formatDisplayDate(monthStr), paidCount: paidMembersCount, totalAmount: totalCollected, unpaidCount: unpaidMembersCount, eligibleCount: eligibleMembers.length };
  });

  const handleExport = () => {
    const csvData = reportData.map(r => ({ "الشهر": r.displayDate, "الأعضاء المؤهلين": r.eligibleCount, "عدد المسددين": r.paidCount, "عدد غير المسددين": r.unpaidCount, "قيمة القسط": MONTHLY_FEE, "المجموع المحصل": r.totalAmount }));
    downloadCSV(csvData, 'monthly_subscription_report');
  };

  const handleExportPDF = () => {
    const headers = ["الشهر", "الأعضاء المؤهلين", "عدد المسددين", "غير المسددين", "نسبة الالتزام", "المجموع المحصل"];
    const rows = reportData.map(r => {
      const percentage = r.eligibleCount > 0 ? Math.round((r.paidCount / r.eligibleCount) * 100) : 0;
      return [r.displayDate, r.eligibleCount, r.paidCount, r.unpaidCount, percentage + '%', formatCurrency(r.totalAmount)];
    });
    generatePDF("تقرير الاشتراكات الشهري - صندوق العائلة", headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-full"><FileBarChart size={20} /></div>
            <div><h2 className="text-lg font-bold">تقرير الاشتراكات الشهري</h2><p className="text-xs opacity-80">يتم احتساب الأعضاء فقط منذ تاريخ انضمامهم</p></div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-border">
          <div className="text-sm text-muted-foreground">إجمالي الأشهر: <span className="font-bold text-foreground">{reportData.length}</span></div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition"><Printer size={16} /> PDF</button>
              <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition"><Download size={16} /> اكسل</button>
            </div>
          )}
        </div>
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-right border-collapse">
            <thead><tr className="bg-gray-100 text-muted-foreground text-sm"><th className="p-3 rounded-r-lg">الشهر</th><th className="p-3">الأعضاء المشتركين</th><th className="p-3">حالة السداد</th><th className="p-3">نسبة الالتزام</th><th className="p-3 rounded-l-lg">المجموع المحصل</th></tr></thead>
            <tbody className="divide-y divide-border">
              {reportData.map((row) => {
                const percentage = row.eligibleCount > 0 ? Math.round((row.paidCount / row.eligibleCount) * 100) : 0;
                return (
                  <tr key={row.monthStr} className="hover:bg-primary-50/30 transition">
                    <td className="p-4 font-bold text-foreground">{row.displayDate}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-muted-foreground">{row.eligibleCount} عضو</span></td>
                    <td className="p-4"><div className="flex items-center gap-2 text-sm"><span className="text-green-600 font-bold">{row.paidCount} دفعوا</span>{row.unpaidCount > 0 && <><span className="text-gray-300">|</span><span className="text-red-400">{row.unpaidCount} لم يدفعوا</span></>}</div></td>
                    <td className="p-4 align-middle">
                      {row.eligibleCount > 0 ? (<><div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div></div><span className="text-[10px] text-muted-foreground mt-1 block">{percentage}%</span></>) : <span className="text-xs text-muted-foreground">-</span>}
                    </td>
                    <td className="p-4 font-bold text-primary text-lg">{formatCurrency(row.totalAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
