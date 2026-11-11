import { useMemo, useState } from 'react';
import { CalendarDays, Calculator as CalcIcon, X } from 'lucide-react';
import type { Expense } from '../types';
import Calculator from './Calculator';

export default function ExpenseModal({ categories, people, onClose, onSave }: {
  categories: string[]; people: string[]; onClose: () => void; onSave: (e: Expense) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [category, setCategory] = useState(categories[0] || 'Other');
  const [person, setPerson] = useState(people[0] || 'Myself');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [calc, setCalc] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const valid = Number(amount) > 0 && Number.isFinite(Number(amount));
  const monthLabel = useMemo(() => new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'}),[date]);
  return <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/60 p-0 sm:place-items-center sm:p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
      <header className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-violet-500">New transaction</p><h2 className="text-2xl font-bold">Add expense</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X/></button></header>
      <label className="field-label">Date</label>
      <div className="relative"><input className="field-input" type="date" value={date} max={new Date().toISOString().slice(0,10)} onChange={e=>setDate(e.target.value)}/><button onClick={()=>setCalendar(!calendar)} className="absolute right-3 top-3 text-slate-500"><CalendarDays size={18}/></button></div>
      {calendar && <p className="mb-3 text-xs text-slate-500">Choose any past or present date · {monthLabel}</p>}
      <label className="field-label">Category</label><select className="field-input" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>
      <label className="field-label">For / With</label><select className="field-input" value={person} onChange={e=>setPerson(e.target.value)}>{people.map(x=><option key={x}>{x}</option>)}</select>
      <label className="field-label">Description</label><input className="field-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What was this expense for?"/>
      <label className="field-label">Amount (₹)</label><div className="relative"><input className="field-input pr-12" inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/><button onClick={()=>setCalc(!calc)} className="absolute right-3 top-3 text-violet-600"><CalcIcon size={20}/></button></div>
      {calc && <div className="mb-4"><Calculator value={amount} onChange={setAmount} onClose={()=>setCalc(false)}/></div>}
      <button disabled={!valid || !date || !category || !person} onClick={()=>onSave({id:crypto.randomUUID(),Date:date,Expense:Number(amount),Category:category,'For/With':person,Description:description.trim()})} className="mt-3 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-40">Save expense</button>
    </section>
  </div>;
}
