import { useState } from 'react';
import { Delete } from 'lucide-react';

export default function Calculator({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const [expr, setExpr] = useState(value || '');
  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','⌫','+'];
  function press(k: string) {
    if (k === '⌫') setExpr(v => v.slice(0,-1));
    else setExpr(v => v + (k === '×' ? '*' : k === '÷' ? '/' : k === '−' ? '-' : k));
  }
  function calculate() {
    if (!/^[0-9+\-*/(). ]+$/.test(expr)) return;
    try {
      // Restrictive character allowlist; no identifiers or function calls.
      const result = Function(`"use strict"; return (${expr})`)();
      if (Number.isFinite(result)) setExpr(String(Math.round(result * 100) / 100));
    } catch { /* leave expression unchanged */ }
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <div className="mb-3 rounded-xl bg-slate-100 p-4 text-right text-2xl font-semibold dark:bg-slate-800">{expr || '0'}</div>
    <div className="grid grid-cols-4 gap-2">{keys.map(k => <button key={k} onClick={() => press(k)} className="rounded-xl bg-slate-100 py-3 font-semibold active:scale-95 dark:bg-slate-800">{k === '⌫' ? <Delete className="mx-auto" size={18}/> : k}</button>)}</div>
    <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={calculate} className="rounded-xl bg-violet-100 py-3 font-semibold text-violet-700">Calculate</button><button onClick={() => { onChange(expr); onClose(); }} className="rounded-xl bg-violet-600 py-3 font-semibold text-white">Use amount</button></div>
  </div>;
}
