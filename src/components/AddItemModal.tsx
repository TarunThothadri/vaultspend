import { useState } from 'react';
import { X } from 'lucide-react';
export default function AddItemModal({ type, onClose, onSave }: { type: 'Category'|'For/With'; onClose:()=>void; onSave:(v:string)=>void }) {
  const [value,setValue]=useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section className="w-full max-w-sm rounded-3xl bg-white p-6 dark:bg-slate-900">
    <div className="mb-4 flex justify-between"><h2 className="text-xl font-bold">Add {type}</h2><button onClick={onClose}><X/></button></div>
    <input autoFocus className="field-input" value={value} onChange={e=>setValue(e.target.value)} placeholder={`Enter ${type.toLowerCase()}`}/>
    <button onClick={()=>value.trim()&&onSave(value.trim())} className="mt-4 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white">Add {type}</button>
  </section></div>;
}
