import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Expense } from '../types';

export default function ImportPrompt({ onClose, onImport }: { onClose:()=>void; onImport:(rows:Expense[])=>void }) {
  const input=useRef<HTMLInputElement>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function read(file?:File) {
    if(!file)return;
    setBusy(true);setError('');
    try {
      const bytes=await file.arrayBuffer();
      const wb=XLSX.read(bytes,{type:'array',cellDates:true});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:''});
      const rows:Expense[]=raw.map((r,i)=>{
        const dateValue=r.Date;
        let date='';
        if(dateValue instanceof Date) date=dateValue.toISOString().slice(0,10);
        else if(typeof dateValue==='number') date=XLSX.SSF.format('yyyy-mm-dd',dateValue);
        else {
          const s=String(dateValue).trim();
          const m=s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
          date=m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s.slice(0,10);
        }
        const amount=Number(String(r.Expense).replace(/[,₹\s]/g,''));
        if(!date || !Number.isFinite(amount) || amount<=0) throw new Error(`Row ${i+2}: invalid Date or Expense.`);
        return {id:crypto.randomUUID(),Date:date,Expense:amount,Category:String(r.Category||'Other').trim()||'Other','For/With':String(r['For/With']||r['For With']||'Myself').trim()||'Myself',Description:String(r.Description||'').trim()};
      });
      if(!rows.length)throw new Error('No transactions found. Expected columns: Date, Expense, Category, For/With, Description.');
      onImport(rows);
    }catch(e){setError(e instanceof Error?e.message:'Could not import this file.');}
    finally{setBusy(false);}
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-500">Welcome to VaultSpend</p><h2 className="mt-2 text-2xl font-bold">Did you have previous expenses to import?</h2></div><button onClick={onClose}><X/></button></div>
    <p className="mt-3 text-sm leading-6 text-slate-500">Your dashboard is empty. Import an Excel or CSV file with the columns Date, Expense, Category, For/With and Description. Nothing is uploaded automatically.</p>
    <input ref={input} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>read(e.target.files?.[0])}/>
    <button disabled={busy} onClick={()=>input.current?.click()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white"><FileUp size={18}/>{busy?'Importing…':'Choose Excel / CSV file'}</button>
    {error&&<p className="mt-3 text-sm text-red-500">{error}</p>}
    <button onClick={onClose} className="mt-3 w-full rounded-xl border border-slate-200 py-3 font-semibold dark:border-slate-700">Start with an empty dashboard</button>
  </section></div>;
}
