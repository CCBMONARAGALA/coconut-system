import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  PieChart, 
  Download, 
  Filter, 
  Calendar,
  ChevronDown,
  Warehouse,
  Briefcase,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  DollarSign,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { Notification, User, CashSale } from '../types';
import * as XLSX from 'xlsx';

interface ReportsProps {
  user: User;
  selectedYear: string;
}

export default function Reports({ user, selectedYear }: ReportsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cashSales, setCashSales] = useState<CashSale[]>([]);
  const [filterType, setFilterType] = useState<'program' | 'nursery' | 'other-nursery' | 'gn' | 'journal-cdo' | 'journal-gn' | 'cash-sales' | 'issue-order-details'>('program');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashSalesSubFilter, setCashSalesSubFilter] = useState<'cdo' | 'gn'>('cdo');
  const [nurseryTypeFilter, setNurseryTypeFilter] = useState<'Total' | 'Main' | 'Other'>('Total');
  const [loading, setLoading] = useState(true);

  const isAdmin = user.role?.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        let notifUrl = isAdmin ? `/api/notifications?year=${selectedYear}` : `/api/notifications?nursery_name=${encodeURIComponent(user.nursery_name || '')}&year=${selectedYear}`;
        let cashUrl = isAdmin ? `/api/cash-sales?year=${selectedYear}` : `/api/cash-sales?nursery_name=${encodeURIComponent(user.nursery_name || '')}&year=${selectedYear}`;
        
        const [notifRes, cashRes, otherCashRes] = await Promise.all([
          fetch(notifUrl),
          fetch(cashUrl),
          fetch(`/api/other-nursery-cash-sales?year=${selectedYear}`)
        ]);
        
        const notifData = await notifRes.json();
        const cashData = await cashRes.json();
        const otherCashData = await otherCashRes.json();
        
        setNotifications(notifData);
        // Combine both cash sales sources
        setCashSales([...cashData, ...otherCashData.map((cs: any) => ({ ...cs, nursery_type: 'Other' }))]);
      } catch (err) {
        console.error('Failed to fetch report data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin, user.nursery_name, selectedYear]);

  // Grouping logic
  const allPrograms = Array.from(new Set(notifications.map(n => (n.program_name || 'Unknown Program') as string))).sort() as string[];
  const allCDOs = Array.from(new Set(notifications.map(n => (n.cdo_name || 'Unknown CDO') as string))).sort() as string[];
  const allGNs = Array.from(new Set(notifications.map(n => (n.gn_name || 'Unknown GN') as string))).sort() as string[];
  const mainNurseries = Array.from(new Set(notifications.filter(n => n.nursery_type === 'Main').map(n => n.nursery_name as string))).sort() as string[];

  const availablePrices = Array.from<number>(new Set(notifications.filter(n => n.journal_price && n.received_receipts > 0).map(n => n.journal_price as number))).sort((a, b) => a - b);

  const matrixData = notifications.reduce((acc: any, n) => {
    const cdo = n.cdo_name || 'Unknown CDO';
    const program = n.program_name || 'Unknown Program';
    
    if (!acc[cdo]) acc[cdo] = {};
    if (!acc[cdo][program]) {
      acc[cdo][program] = { target: 0, issued: 0, received: 0 };
    }
    
    acc[cdo][program].target += n.quantity;
    acc[cdo][program].issued += n.issued_quantity;
    acc[cdo][program].received += n.received_receipts;
    
    return acc;
  }, {});

  const cdoMatrixData = notifications.reduce((acc: any, n) => {
    if (nurseryTypeFilter !== 'Total' && n.nursery_type !== nurseryTypeFilter) return acc;
    const cdo = n.cdo_name || 'Unknown CDO';
    const program = n.program_name || 'Unknown Program';
    const type = (n.seedling_type || 'Field').toLowerCase() as 'field' | 'potted';
    
    if (!acc[cdo]) acc[cdo] = {};
    if (!acc[cdo][program]) {
      acc[cdo][program] = { 
        field: { target: 0, issued: 0, received: 0, prices: {} as Record<number, number> },
        potted: { target: 0, issued: 0, received: 0, prices: {} as Record<number, number> }
      };
    }
    
    acc[cdo][program][type].target += n.quantity;
    acc[cdo][program][type].issued += n.issued_quantity;
    acc[cdo][program][type].received += n.received_receipts;

    if (n.journal_price) {
      acc[cdo][program][type].prices[n.journal_price] = (acc[cdo][program][type].prices[n.journal_price] || 0) + n.received_receipts;
    }
    
    return acc;
  }, {});

  const nurseryMatrixData = notifications.reduce((acc: any, n) => {
    if (n.nursery_type !== 'Main') return acc;
    const nursery = n.nursery_name;
    const program = n.program_name || 'Unknown Program';
    const type = (n.seedling_type || 'Field').toLowerCase() as 'field' | 'potted';
    
    if (!acc[program]) acc[program] = {};
    if (!acc[program][nursery]) {
      acc[program][nursery] = { 
        field: { target: 0, issued: 0, received: 0 },
        potted: { target: 0, issued: 0, received: 0 }
      };
    }
    
    acc[program][nursery][type].target += n.quantity;
    acc[program][nursery][type].issued += n.issued_quantity;
    acc[program][nursery][type].received += n.received_receipts;
    
    return acc;
  }, {});

  const gnMatrixData = notifications.reduce((acc: any, n) => {
    if (nurseryTypeFilter !== 'Total' && n.nursery_type !== nurseryTypeFilter) return acc;
    const gn = n.gn_name || 'Unknown GN';
    const program = n.program_name || 'Unknown Program';
    const type = (n.seedling_type || 'Field').toLowerCase() as 'field' | 'potted';
    
    if (!acc[gn]) acc[gn] = {};
    if (!acc[gn][program]) {
      acc[gn][program] = { 
        field: { target: 0, issued: 0, received: 0, prices: {} as Record<number, number> },
        potted: { target: 0, issued: 0, received: 0, prices: {} as Record<number, number> }
      };
    }
    
    acc[gn][program][type].target += n.quantity;
    acc[gn][program][type].issued += n.issued_quantity;
    acc[gn][program][type].received += n.received_receipts;

    if (n.journal_price) {
      acc[gn][program][type].prices[n.journal_price] = (acc[gn][program][type].prices[n.journal_price] || 0) + n.received_receipts;
    }
    
    return acc;
  }, {});

  const cashSalesMatrixData = cashSales.reduce((acc: any, cs) => {
    const cdo = cs.cdo_name || 'Unknown CDO';
    const gn = cs.gn_name || 'Unknown GN';
    const type = (cs.seedling_type || 'Field').toLowerCase() as 'field' | 'potted';
    
    if (!acc.cdo[cdo]) acc.cdo[cdo] = { field: 0, potted: 0 };
    acc.cdo[cdo][type] += cs.quantity;

    if (!acc.gn[gn]) acc.gn[gn] = { field: 0, potted: 0 };
    acc.gn[gn][type] += cs.quantity;

    return acc;
  }, { cdo: {}, gn: {} });

  const groupedData = notifications.reduce((acc: any, n) => {
    let key = '';
    if (filterType === 'program' || filterType === 'nursery' || filterType === 'gn' || filterType === 'journal-cdo' || filterType === 'journal-gn') return acc; 
    else if (filterType === 'issue-order-details') {
      const d = new Date(n.date);
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (d < s || d > e) return acc;
      
      const key = `${n.notification_no}-${n.cdo_name}`;
      if (!acc[key]) {
        acc[key] = {
          notification_no: n.notification_no,
          cdo_name: n.cdo_name,
          quantity: 0,
          issued: 0,
          date: n.date
        };
      }
      acc[key].quantity += n.quantity;
      acc[key].issued += n.issued_quantity;
      return acc;
    }
    else if (filterType === 'other-nursery') {
      if (n.nursery_type !== 'Other') return acc;
      key = n.nursery_name;
    }
    else if (filterType === 'gn') key = n.gn_name || 'Unknown GN';

    if (!acc[key]) {
      acc[key] = { 
        target: 0, 
        issued: 0, 
        received: 0, 
        count: 0,
        field: { target: 0, issued: 0 },
        potted: { target: 0, issued: 0 }
      };
    }
    
    const type = (n.seedling_type || 'Field').toLowerCase() as 'field' | 'potted';
    if (filterType === 'other-nursery') {
      acc[key][type].target += n.quantity;
      acc[key][type].issued += n.issued_quantity;
    }

    acc[key].target += n.quantity;
    acc[key].issued += n.issued_quantity;
    acc[key].received += n.received_receipts;
    acc[key].count += 1;
    return acc;
  }, {});

  const reportItems = Object.entries(groupedData).map(([name, stats]: [string, any]) => ({
    name,
    ...stats
  }));

  const exportToExcel = () => {
    if (filterType === 'program') {
      const header1 = ['CDO Division'];
      const header2 = [''];
      
      allPrograms.forEach(prog => {
        if (isAdmin) {
          header1.push(prog, '', '', '', '');
          header2.push('Total Seedlings', 'Issued Seedlings', 'Balance', 'Update Receipts', 'Receipts Balance');
        } else {
          header1.push(prog, '', '');
          header2.push('Total Seedlings', 'Issued Seedlings', 'Balance');
        }
      });

      const rows = allCDOs.map(cdo => {
        const row: (string | number)[] = [cdo];
        allPrograms.forEach(prog => {
          const stats = matrixData[cdo]?.[prog] || { target: 0, issued: 0, received: 0 };
          row.push(
            stats.target,
            stats.issued,
            stats.target - stats.issued
          );
          if (isAdmin) {
            row.push(
              stats.received,
              stats.issued - stats.received
            );
          }
        });
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "By Program Report");
      XLSX.writeFile(wb, `By_Program_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'nursery') {
      const header1 = ['Program'];
      const header2 = [''];
      const header3 = [''];
      
      mainNurseries.forEach(nursery => {
        header1.push(nursery, '', '', '', '', '', '', '', '');
        header2.push('Total Seedlings', '', '', 'Issued Seedlings', '', '', 'Nursery issued seedlings Balance', '', '');
        header3.push('Field', 'Potted', 'Totel', 'Field', 'Potted', 'Totel', 'Field', 'Potted', 'Totel');
      });

      const rows = allPrograms.map(prog => {
        const row: (string | number)[] = [prog];
        mainNurseries.forEach(nursery => {
          const stats = nurseryMatrixData[prog]?.[nursery] || { 
            field: { target: 0, issued: 0, received: 0 },
            potted: { target: 0, issued: 0, received: 0 }
          };
          
          const totalTarget = stats.field.target + stats.potted.target;
          const totalIssued = stats.field.issued + stats.potted.issued;
          const totalBalance = totalTarget - totalIssued;

          row.push(
            stats.field.target, stats.potted.target, totalTarget,
            stats.field.issued, stats.potted.issued, totalIssued,
            stats.field.target - stats.field.issued, stats.potted.target - stats.potted.issued, totalBalance
          );
        });
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([header1, header2, header3, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Main Nursery Report");
      XLSX.writeFile(wb, `Main_Nursery_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'other-nursery') {
      const header1 = ['OTHER NURSERY NAME', 'Total Seedlings', '', '', 'Issued Seedlings', '', ''];
      const header2 = ['', 'Field', 'Potted', 'Total', 'Field', 'Potted', 'Total'];

      const rows: (string | number)[][] = reportItems.map(item => [
        item.name,
        item.field.target,
        item.potted.target,
        item.target,
        item.field.issued,
        item.potted.issued,
        item.issued
      ]);

      const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Other Nursery Report");
      XLSX.writeFile(wb, `Other_Nursery_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'gn') {
      const header1 = ['GN Division'];
      const header2 = [''];
      const header3 = [''];
      
      allPrograms.forEach(prog => {
        if (isAdmin) {
          header1.push(prog, '', '', '', '', '', '', '', '');
          header2.push('Total Seedlings', '', '', 'Issued Seedlings', '', '', 'Update Receipts', '', '');
          header3.push('Field', 'Potted', 'Total', 'Field', 'Potted', 'Total', 'Field', 'Potted', 'Total');
        } else {
          header1.push(prog, '', '', '', '', '');
          header2.push('Total Seedlings', '', '', 'Issued Seedlings', '', '');
          header3.push('Field', 'Potted', 'Total', 'Field', 'Potted', 'Total');
        }
      });

      const rows = allGNs.map(gn => {
        const row: (string | number)[] = [gn];
        allPrograms.forEach(prog => {
          const stats = gnMatrixData[gn]?.[prog] || { 
            field: { target: 0, issued: 0, received: 0 },
            potted: { target: 0, issued: 0, received: 0 }
          };
          
          const totalTarget = stats.field.target + stats.potted.target;
          const totalIssued = stats.field.issued + stats.potted.issued;

          row.push(
            stats.field.target, stats.potted.target, totalTarget,
            stats.field.issued, stats.potted.issued, totalIssued
          );

          if (isAdmin) {
            const totalReceived = stats.field.received + stats.potted.received;
            row.push(
              stats.field.received, stats.potted.received, totalReceived
            );
          }
        });
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([header1, header2, header3, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "By GN Division Report");
      XLSX.writeFile(wb, `By_GN_Division_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'journal-cdo' || filterType === 'journal-gn') {
      const isCDO = filterType === 'journal-cdo';
      const header1 = [isCDO ? 'CDO Division' : 'GN Division'];
      const header2 = [''];
      const header3 = [''];
      
      allPrograms.forEach(prog => {
        const colSpan = (availablePrices.length * 2) + 1;
        header1.push(prog, ...Array(colSpan - 1).fill(''));
        header2.push('Field', ...Array(availablePrices.length - 1).fill(''), 'Potted', ...Array(availablePrices.length - 1).fill(''), 'Total Journal Price');
        availablePrices.forEach(p => header3.push(p.toFixed(2)));
        availablePrices.forEach(p => header3.push(p.toFixed(2)));
        header3.push('');
      });

      const items = isCDO ? allCDOs : allGNs;
      const data = isCDO ? cdoMatrixData : gnMatrixData;

      const rows = items.map(item => {
        const row: (string | number)[] = [item];
        allPrograms.forEach(prog => {
          const stats = data[item]?.[prog] || { 
            field: { prices: {} },
            potted: { prices: {} }
          };
          
          let total = 0;
          availablePrices.forEach((p: number) => {
            const count = stats.field.prices[p] || 0;
            row.push(count);
            total += count * p;
          });
          availablePrices.forEach((p: number) => {
            const count = stats.potted.prices[p] || 0;
            row.push(count);
            total += count * p;
          });
          row.push(total);
        });
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([header1, header2, header3, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Journal_Price_${isCDO ? 'CDO' : 'GN'}_Report`);
      XLSX.writeFile(wb, `Journal_Price_${isCDO ? 'CDO' : 'GN'}_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'cash-sales') {
      const isCDO = cashSalesSubFilter === 'cdo';
      const headers = [isCDO ? 'CDO Division' : 'GN Division', 'Field', 'Potted', 'Total'];
      const data = isCDO ? cashSalesMatrixData.cdo : cashSalesMatrixData.gn;
      
      const rows = Object.entries(data).map(([name, stats]: [string, any]) => [
        name,
        stats.field,
        stats.potted,
        stats.field + stats.potted
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Cash_Sales_${isCDO ? 'CDO' : 'GN'}_Report`);
      XLSX.writeFile(wb, `Cash_Sales_${isCDO ? 'CDO' : 'GN'}_Report_${selectedYear}.xlsx`);
    } else if (filterType === 'issue-order-details') {
      const headers = [
        'Issue Order No',
        'CDO Division',
        'Quantity',
        'Nursery issued seedlings',
        'Nursery issued seedlings Balance'
      ];

      const rows: (string | number)[][] = reportItems.map(item => [
        item.notification_no,
        item.cdo_name,
        item.quantity,
        item.issued,
        item.quantity - item.issued
      ]);

      // Add totals row
      rows.push([
        'TOTAL',
        '',
        reportItems.reduce((sum, item) => sum + item.quantity, 0),
        reportItems.reduce((sum, item) => sum + item.issued, 0),
        reportItems.reduce((sum, item) => sum + (item.quantity - item.issued), 0)
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Issue Order Details");
      XLSX.writeFile(wb, `Issue_Order_Details_${startDate}_to_${endDate}.xlsx`);
    } else {
      const headers = [
        filterType.toUpperCase() + ' NAME',
        'NOTIFICATIONS',
        'TARGET QTY',
        'ISSUED QTY',
        'BALANCE',
        'UPDATE RECEIPTS',
        'RECEIPTS BALANCE',
        'PROGRESS %'
      ];

      const rows: (string | number)[][] = reportItems.map(item => [
        item.name,
        item.count,
        item.target,
        item.issued,
        item.target - item.issued,
        item.received,
        item.issued - item.received,
        item.target > 0 ? Math.round((item.issued / item.target) * 100) : 0
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${filterType} Report`);
      XLSX.writeFile(wb, `${filterType}_Report_${selectedYear}.xlsx`);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-table-container');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = filterType === 'issue-order-details' ? 'Issue Order- Details of coconut plants' : 'Report';

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 30px; font-size: 10px; color: #666; }
            .totals { font-weight: bold; background-color: #f9f9f9; }
            .text-right { text-align: right; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${user.nursery_name || 'Coconut Management System'}</h2>
            <h3>${title}</h3>
            ${filterType === 'issue-order-details' ? `<p>Period: ${startDate} to ${endDate}</p>` : ''}
          </div>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setFilterType('program')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'program' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Briefcase size={16} />
              <span>By Program</span>
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setFilterType('nursery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'nursery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Warehouse size={16} />
                  <span>By Main Nursery</span>
                </button>
                <button 
                  onClick={() => setFilterType('other-nursery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'other-nursery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Warehouse size={16} />
                  <span>By Other Nursery</span>
                </button>
              </>
            )}
            <button 
              onClick={() => setFilterType('gn')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'gn' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MapPin size={16} />
              <span>By GN Division</span>
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setFilterType('journal-cdo')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'journal-cdo' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FileSpreadsheet size={16} />
                  <span>Journal Price – CDO</span>
                </button>
                <button 
                  onClick={() => setFilterType('journal-gn')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'journal-gn' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <FileSpreadsheet size={16} />
                  <span>Journal Price – GN</span>
                </button>
              </>
            )}
            {!isAdmin && (
              <button 
                onClick={() => setFilterType('issue-order-details')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'issue-order-details' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <FileSpreadsheet size={16} />
                <span>Issue Order Details</span>
              </button>
            )}
            <button 
              onClick={() => setFilterType('cash-sales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === 'cash-sales' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <DollarSign size={16} />
              <span>Cash Sales</span>
            </button>
          </div>

          {(filterType === 'journal-cdo' || filterType === 'journal-gn') && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              {(['Total', 'Main', 'Other'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNurseryTypeFilter(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${nurseryTypeFilter === type ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {type === 'Total' ? 'Nurseries Total' : type === 'Main' ? 'Main Nursery' : 'Other Nurseries'}
                </button>
              ))}
            </div>
          )}

          {filterType === 'cash-sales' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setCashSalesSubFilter('cdo')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${cashSalesSubFilter === 'cdo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Cash Sales – CDO
              </button>
              <button
                onClick={() => setCashSalesSubFilter('gn')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${cashSalesSubFilter === 'gn' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Cash Sales – GN
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
          >
            <Printer size={18} />
            <span>Print Report</span>
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {filterType === 'issue-order-details' ? (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-800">Filter by Date Range</h3>
            <p className="text-sm text-slate-500">Select the period for Issue Order Details report</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 px-4 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700"
              />
            </div>
            <div className="flex items-center gap-2 px-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700"
              />
            </div>
          </div>
        </div>
      ) : (filterType !== 'gn' && filterType !== 'program' && filterType !== 'journal-cdo' && filterType !== 'journal-gn' && filterType !== 'cash-sales') && (
        <div className={`grid grid-cols-1 ${filterType === 'other-nursery' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
          {filterType === 'nursery' ? (
            <>
              {/* Total Seedlings Card */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total Seedlings</p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  {mainNurseries.map(nursery => {
                    const target = notifications.filter(n => n.nursery_name === nursery).reduce((sum, n) => sum + n.quantity, 0);
                    return (
                      <div key={nursery} className="text-center border-r last:border-r-0 border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{nursery}</p>
                        <p className="text-xl font-black text-slate-800">{target.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Issued Seedlings Card */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Issued Seedlings</p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  {mainNurseries.map(nursery => {
                    const issued = notifications.filter(n => n.nursery_name === nursery).reduce((sum, n) => sum + n.issued_quantity, 0);
                    return (
                      <div key={nursery} className="text-center border-r last:border-r-0 border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{nursery}</p>
                        <p className="text-xl font-black text-emerald-600">{issued.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Balance Card */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Nursery issued seedlings Balance</p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  {mainNurseries.map(nursery => {
                    const target = notifications.filter(n => n.nursery_name === nursery).reduce((sum, n) => sum + n.quantity, 0);
                    const issued = notifications.filter(n => n.nursery_name === nursery).reduce((sum, n) => sum + n.issued_quantity, 0);
                    return (
                      <div key={nursery} className="text-center border-r last:border-r-0 border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{nursery}</p>
                        <p className="text-xl font-black text-blue-600">{(target - issued).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : filterType === 'other-nursery' ? (
            <>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Seedlings</p>
                <p className="text-4xl font-black text-slate-800">
                  {notifications.filter(n => n.nursery_type === 'Other').reduce((sum, n) => sum + n.quantity, 0).toLocaleString()}
                </p>
                <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <TrendingUp size={16} />
                  <span>Other Nurseries Total</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issued Seedlings</p>
                <p className="text-4xl font-black text-emerald-600">
                  {notifications.filter(n => n.nursery_type === 'Other').reduce((sum, n) => sum + n.issued_quantity, 0).toLocaleString()}
                </p>
                <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <BarChart size={16} />
                  <span>Other Nurseries Issued</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Target</p>
                <p className="text-4xl font-black text-slate-800">{notifications.reduce((sum, n) => sum + n.quantity, 0).toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <TrendingUp size={16} />
                  <span>Seedlings Allocated</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Issued</p>
                <p className="text-4xl font-black text-slate-800">{notifications.reduce((sum, n) => sum + n.issued_quantity, 0).toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <BarChart size={16} />
                  <span>Seedlings Distributed</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Completion</p>
                <p className="text-4xl font-black text-slate-800">
                  {notifications.length > 0 ? Math.round((notifications.reduce((sum, n) => sum + n.issued_quantity, 0) / notifications.reduce((sum, n) => sum + n.quantity, 0)) * 100) : 0}%
                </p>
                <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${notifications.length > 0 ? (notifications.reduce((sum, n) => sum + n.issued_quantity, 0) / notifications.reduce((sum, n) => sum + n.quantity, 0)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Detailed Report Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">
            Detailed Analysis by {
              filterType === 'other-nursery' ? 'Other Nursery' : 
              filterType === 'nursery' ? 'Main Nursery' :
              filterType === 'issue-order-details' ? 'Issue Order Details' :
              filterType === 'cash-sales' ? `Cash Sales – ${cashSalesSubFilter.toUpperCase()}` :
              filterType.charAt(0).toUpperCase() + filterType.slice(1)
            }
          </h4>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filterType === 'program' ? allCDOs.length : filterType === 'nursery' ? allPrograms.length : 
             filterType === 'cash-sales' ? Object.keys(cashSalesSubFilter === 'cdo' ? cashSalesMatrixData.cdo : cashSalesMatrixData.gn).length :
             reportItems.length} Groups Found
          </span>
        </div>
        <div className="overflow-x-auto" id="report-table-container">
          {filterType === 'program' ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th rowSpan={2} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 min-w-[200px]">CDO Division</th>
                  {allPrograms.map(prog => (
                    <th key={prog} colSpan={isAdmin ? 5 : 3} className="p-4 text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center border-r border-slate-100 bg-emerald-50/30">
                      {prog}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  {allPrograms.map(prog => (
                    <React.Fragment key={prog}>
                      <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Total Seedlings</th>
                      <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Issued Seedlings</th>
                      <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Balance</th>
                      {isAdmin && (
                        <>
                          <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Update Receipts</th>
                          <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-100">Receipts Balance</th>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={1 + allPrograms.length * (isAdmin ? 5 : 3)} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : allCDOs.length === 0 ? (
                  <tr><td colSpan={1 + allPrograms.length * (isAdmin ? 5 : 3)} className="p-12 text-center text-slate-400">No data available</td></tr>
                ) : (
                  allCDOs.map(cdo => (
                    <tr key={cdo} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white z-10">{cdo}</td>
                      {allPrograms.map(prog => {
                        const stats = matrixData[cdo]?.[prog] || { target: 0, issued: 0, received: 0 };
                        return (
                          <React.Fragment key={prog}>
                            <td className="p-2 text-center text-xs font-medium text-slate-600 border-r border-slate-50">{stats.target.toLocaleString()}</td>
                            <td className="p-2 text-center text-xs font-bold text-emerald-600 border-r border-slate-50">{stats.issued.toLocaleString()}</td>
                            <td className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-50">{(stats.target - stats.issued).toLocaleString()}</td>
                            {isAdmin && (
                              <>
                                <td className="p-2 text-center text-xs font-bold text-blue-600 border-r border-slate-50">{stats.received.toLocaleString()}</td>
                                <td className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-100">{(stats.issued - stats.received).toLocaleString()}</td>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : filterType === 'nursery' ? (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th rowSpan={3} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 min-w-[200px]">Program</th>
                  {mainNurseries.map(nursery => (
                    <th key={nursery} colSpan={9} className="p-4 text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center border-r border-slate-100 bg-emerald-50/30">
                      {nursery}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  {mainNurseries.map(nursery => (
                    <React.Fragment key={nursery}>
                      <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Total Seedlings</th>
                      <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Issued Seedlings</th>
                      <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-100">Nursery issued seedlings Balance</th>
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/5">
                  {mainNurseries.map(nursery => (
                    <React.Fragment key={nursery}>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-50 bg-slate-100/30">Totel</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-50 bg-slate-100/30">Totel</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/30">Totel</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={1 + mainNurseries.length * 9} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : allPrograms.length === 0 ? (
                  <tr><td colSpan={1 + mainNurseries.length * 9} className="p-12 text-center text-slate-400">No data available</td></tr>
                ) : (
                  allPrograms.map(prog => (
                    <tr key={prog} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white z-10">{prog}</td>
                      {mainNurseries.map(nursery => {
                        const stats = nurseryMatrixData[prog]?.[nursery] || { 
                          field: { target: 0, issued: 0, received: 0 },
                          potted: { target: 0, issued: 0, received: 0 }
                        };
                        
                        const totalTarget = stats.field.target + stats.potted.target;
                        const totalIssued = stats.field.issued + stats.potted.issued;
                        const fieldBalance = stats.field.target - stats.field.issued;
                        const pottedBalance = stats.potted.target - stats.potted.issued;
                        const totalBalance = totalTarget - totalIssued;

                        return (
                          <React.Fragment key={nursery}>
                            <td className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{stats.field.target.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{stats.potted.target.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] font-bold text-slate-800 border-r border-slate-50 bg-slate-50/30">{totalTarget.toLocaleString()}</td>
                            
                            <td className="p-2 text-center text-[10px] text-emerald-600 border-r border-slate-50">{stats.field.issued.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] text-emerald-600 border-r border-slate-50">{stats.potted.issued.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] font-bold text-emerald-700 border-r border-slate-50 bg-emerald-50/10">{totalIssued.toLocaleString()}</td>
                            
                            <td className="p-2 text-center text-[10px] text-slate-500 border-r border-slate-50">{fieldBalance.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] text-slate-500 border-r border-slate-50">{pottedBalance.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30">{totalBalance.toLocaleString()}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : filterType === 'other-nursery' ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th rowSpan={2} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 min-w-[200px]">OTHER NURSERY NAME</th>
                  <th colSpan={3} className="p-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center border-r border-slate-100 bg-slate-50/50">Total Seedlings</th>
                  <th colSpan={3} className="p-4 text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center border-r border-slate-100 bg-emerald-50/30">Issued Seedlings</th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                  <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                  <th className="p-2 text-[9px] font-bold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/30">Total</th>
                  <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                  <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                  <th className="p-2 text-[9px] font-bold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/30">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : reportItems.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">No data available for this filter</td></tr>
                ) : (
                  reportItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 border-r border-slate-100">{item.name}</td>
                      <td className="p-2 text-center text-xs text-slate-600 border-r border-slate-50">{item.field.target.toLocaleString()}</td>
                      <td className="p-2 text-center text-xs text-slate-600 border-r border-slate-50">{item.potted.target.toLocaleString()}</td>
                      <td className="p-2 text-center text-xs font-bold text-slate-800 border-r border-slate-100 bg-slate-50/30">{item.target.toLocaleString()}</td>
                      <td className="p-2 text-center text-xs text-emerald-600 border-r border-slate-50">{item.field.issued.toLocaleString()}</td>
                      <td className="p-2 text-center text-xs text-emerald-600 border-r border-slate-50">{item.potted.issued.toLocaleString()}</td>
                      <td className="p-2 text-center text-xs font-bold text-emerald-700 border-r border-slate-100 bg-emerald-50/10">{item.issued.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : filterType === 'gn' ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th rowSpan={3} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 min-w-[200px] sticky left-0 bg-slate-50 z-20">GN Division</th>
                  {allPrograms.map(prog => (
                    <th key={prog} colSpan={isAdmin ? 9 : 6} className="p-4 text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center border-r border-slate-100 bg-emerald-50/30">
                      {prog}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  {allPrograms.map(prog => (
                    <React.Fragment key={prog}>
                      <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Total Seedlings</th>
                      <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Issued Seedlings</th>
                      {isAdmin && (
                        <th colSpan={3} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-100">Update Receipts</th>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/5">
                  {allPrograms.map(prog => (
                    <React.Fragment key={prog}>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-50 bg-slate-100/30">Total</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-50 bg-slate-100/30">Total</th>
                      {isAdmin && (
                        <>
                          <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                          <th className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                          <th className="p-1 text-[8px] font-bold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/30">Total</th>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={1 + allPrograms.length * (isAdmin ? 9 : 6)} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : allGNs.length === 0 ? (
                  <tr><td colSpan={1 + allPrograms.length * (isAdmin ? 9 : 6)} className="p-12 text-center text-slate-400">No data available</td></tr>
                ) : (
                  allGNs.map(gn => (
                    <tr key={gn} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white z-10">{gn}</td>
                      {allPrograms.map(prog => {
                        const stats = gnMatrixData[gn]?.[prog] || { 
                          field: { target: 0, issued: 0, received: 0 },
                          potted: { target: 0, issued: 0, received: 0 }
                        };
                        
                        const totalTarget = stats.field.target + stats.potted.target;
                        const totalIssued = stats.field.issued + stats.potted.issued;

                        return (
                          <React.Fragment key={prog}>
                            <td className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{stats.field.target.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{stats.potted.target.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] font-bold text-slate-800 border-r border-slate-50 bg-slate-50/30">{totalTarget.toLocaleString()}</td>
                            
                            <td className="p-2 text-center text-[10px] text-emerald-600 border-r border-slate-50">{stats.field.issued.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] text-emerald-600 border-r border-slate-50">{stats.potted.issued.toLocaleString()}</td>
                            <td className="p-2 text-center text-[10px] font-bold text-emerald-700 border-r border-slate-50 bg-emerald-50/10">{totalIssued.toLocaleString()}</td>
                            
                            {isAdmin && (
                              <>
                                <td className="p-2 text-center text-[10px] text-blue-600 border-r border-slate-50">{stats.field.received.toLocaleString()}</td>
                                <td className="p-2 text-center text-[10px] text-blue-600 border-r border-slate-50">{stats.potted.received.toLocaleString()}</td>
                                <td className="p-2 text-center text-[10px] font-bold text-blue-700 border-r border-slate-100 bg-blue-50/10">{(stats.field.received + stats.potted.received).toLocaleString()}</td>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (filterType === 'journal-cdo' || filterType === 'journal-gn') ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th rowSpan={3} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 min-w-[200px] sticky left-0 bg-slate-50 z-20">
                    {filterType === 'journal-cdo' ? 'CDO Division' : 'GN Division'}
                  </th>
                  {allPrograms.map(prog => (
                    <th key={prog} colSpan={(availablePrices.length * 2) + 1} className="p-4 text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center border-r border-slate-100 bg-emerald-50/30">
                      {prog}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/10">
                  {allPrograms.map(prog => (
                    <React.Fragment key={prog}>
                      <th colSpan={availablePrices.length} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Field</th>
                      <th colSpan={availablePrices.length} className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">Potted</th>
                      <th rowSpan={2} className="p-2 text-[9px] font-bold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/30">Total Journal Price</th>
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/5">
                  {allPrograms.map(prog => (
                    <React.Fragment key={prog}>
                      {availablePrices.map(price => (
                        <th key={`f-${price}`} className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">{price.toFixed(2)}</th>
                      ))}
                      {availablePrices.map(price => (
                        <th key={`p-${price}`} className="p-1 text-[8px] font-bold text-slate-400 uppercase text-center border-r border-slate-50">{price.toFixed(2)}</th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={1 + allPrograms.length * ((availablePrices.length * 2) + 1)} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : (filterType === 'journal-cdo' ? allCDOs : allGNs).length === 0 ? (
                  <tr><td colSpan={1 + allPrograms.length * ((availablePrices.length * 2) + 1)} className="p-12 text-center text-slate-400">No data available</td></tr>
                ) : (
                  (filterType === 'journal-cdo' ? allCDOs : allGNs).map(item => (
                    <tr key={item} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white z-10">{item}</td>
                      {allPrograms.map(prog => {
                        const stats = (filterType === 'journal-cdo' ? cdoMatrixData : gnMatrixData)[item]?.[prog] || { 
                          field: { prices: {} },
                          potted: { prices: {} }
                        };
                        
                        let total = 0;
                        const fieldPrices = availablePrices.map((p: number) => {
                          const count = stats.field.prices[p] || 0;
                          total += count * p;
                          return count;
                        });
                        const pottedPrices = availablePrices.map((p: number) => {
                          const count = stats.potted.prices[p] || 0;
                          total += count * p;
                          return count;
                        });

                        return (
                          <React.Fragment key={prog}>
                            {fieldPrices.map((count, idx) => (
                              <td key={`f-${idx}`} className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{count.toLocaleString()}</td>
                            ))}
                            {pottedPrices.map((count, idx) => (
                              <td key={`p-${idx}`} className="p-2 text-center text-[10px] text-slate-600 border-r border-slate-50">{count.toLocaleString()}</td>
                            ))}
                            <td className="p-2 text-center text-[10px] font-bold text-slate-800 border-r border-slate-100 bg-slate-50/30">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : filterType === 'issue-order-details' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Order No</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">CDO Division</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nursery issued seedlings</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nursery issued seedlings Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : reportItems.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">No data available for this period</td></tr>
                ) : (
                  <>
                    {reportItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-800">{item.notification_no}</td>
                        <td className="p-4 text-xs text-slate-600">{item.cdo_name}</td>
                        <td className="p-4 text-xs font-bold text-slate-800 text-right">{item.quantity.toLocaleString()}</td>
                        <td className="p-4 text-xs font-bold text-emerald-600 text-right">{item.issued.toLocaleString()}</td>
                        <td className="p-4 text-xs font-bold text-slate-500 text-right">{(item.quantity - item.issued).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/80 font-black totals">
                      <td colSpan={2} className="p-4 text-xs text-slate-800 uppercase tracking-wider">Total</td>
                      <td className="p-4 text-xs text-slate-800 text-right border-t-2 border-slate-200">
                        {reportItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-emerald-700 text-right border-t-2 border-slate-200">
                        {reportItems.reduce((sum, item) => sum + item.issued, 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-slate-700 text-right border-t-2 border-slate-200">
                        {reportItems.reduce((sum, item) => sum + (item.quantity - item.issued), 0).toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          ) : filterType === 'cash-sales' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cashSalesSubFilter === 'cdo' ? 'CDO Division' : 'GN Division'}</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potted</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : Object.keys(cashSalesSubFilter === 'cdo' ? cashSalesMatrixData.cdo : cashSalesMatrixData.gn).length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400">No data available</td></tr>
                ) : (
                  Object.entries(cashSalesSubFilter === 'cdo' ? cashSalesMatrixData.cdo : cashSalesMatrixData.gn).map(([name, stats]: [string, any]) => (
                    <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs text-slate-600 font-bold">{name}</td>
                      <td className="p-4 text-xs text-slate-600">{stats.field.toLocaleString()}</td>
                      <td className="p-4 text-xs text-slate-600">{stats.potted.toLocaleString()}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{(stats.field + stats.potted).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {filterType.toUpperCase()} NAME
                  </th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ISSUE ORDERS</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">TARGET QTY</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">ISSUED QTY</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">PROGRESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading report data...</td></tr>
                ) : reportItems.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">No data available for this filter</td></tr>
                ) : (
                  reportItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-bold text-slate-700">{item.name}</td>
                      <td className="p-6 text-center font-medium text-slate-600">{item.count}</td>
                      <td className="p-6 text-right font-bold text-slate-800">{item.target.toLocaleString()}</td>
                      <td className="p-6 text-right font-bold text-emerald-600">{item.issued.toLocaleString()}</td>
                      <td className="p-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-slate-500">{item.target > 0 ? Math.round((item.issued / item.target) * 100) : 0}%</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${item.target > 0 ? (item.issued / item.target) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
