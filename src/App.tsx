import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, CloudUpload, Plus, LogOut, WalletCards, X } from 'lucide-react';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import ExpenseModal from './components/ExpenseModal';
import AddItemModal from './components/AddItemModal';
import ImportPrompt from './components/ImportPrompt';
import { loadVault, saveVault } from './lib/storage';
import { backupToDrive, getSavedUser, signIn, signOutLocal } from './lib/googleDrive';
import type { Expense, GoogleUser, Timeframe, VaultData } from './types';

export default function App() {
  const [user,setUser]=useState<GoogleUser|null>(getSavedUser());
  const [data,setData]=useState<VaultData|null>(null);
  const [dark,setDark]=useState(localStorage.getItem('vaultspend_dark')==='true');
  const [timeframe,setTimeframe]=useState<Timeframe>('Monthly');
  const [expenseOpen,setExpenseOpen]=useState(false);
  const [addType,setAddType]=useState<'Category'|'For/With'|null>(null);
  const [fabOpen,setFabOpen]=useState(false);
  const [importOpen,setImportOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [toast,setToast]=useState('');
  const [showImportOnce,setShowImportOnce]=useState(false);

  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('vaultspend_dark',String(dark));},[dark]);
  useEffect(()=>{if(!user)return;loadVault().then(v=>{setData(v);if(v.expenses.length===0)setImportOpen(true);}).catch(e=>setToast(e.message));},[user]);
  useEffect(()=>{if(!data)return;const t=window.setTimeout(()=>saveVault(data).catch(e=>setToast(e.message)),250);return()=>window.clearTimeout(t);},[data]);
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),4500);return()=>window.clearTimeout(t);},[toast]);

  async function handleSignIn(){setBusy(true);try{const u=await signIn();setUser(u);}catch(e){setToast(e instanceof Error?e.message:'Google sign-in failed');}finally{setBusy(false);}}
  async function backup(){if(!data)return;setBusy(true);try{await backupToDrive(data);setToast('Backup completed successfully.');}catch(e){setToast(e instanceof Error?e.message:'Backup failed.');}finally{setBusy(false);}}
  function addExpense(e:Expense){setData(d=>d?({...d,expenses:[e,...d.expenses],categories:d.categories.includes(e.Category)?d.categories:[...d.categories,e.Category],people:d.people.includes(e['For/With'])?d.people:[...d.people,e['For/With']] }):d);setExpenseOpen(false);setToast('Expense saved on this device.');}
  function addItem(v:string){setData(d=>d?({...d,categories:addType==='Category'?[...new Set([...d.categories,v])]:d.categories,people:addType==='For/With'?[...new Set([...d.people,v])]:d.people}):d);setAddType(null);setToast(`${addType} added.`);}
  function importRows(rows:Expense[]){setData(d=>d?({...d,expenses:[...rows,...d.expenses],categories:[...new Set([...d.categories,...rows.map(x=>x.Category)])],people:[...new Set([...d.people,...rows.map(x=>x['For/With'])])] }):d);setImportOpen(false);setToast(`${rows.length} transactions imported.`);}
  if(!user)return <SignIn onSignIn={handleSignIn} busy={busy}/>;
  if(!data)return <div className="grid min-h-screen place-items-center text-slate-500">Loading your encrypted vault…</div>;
  return <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><WalletCards/></div><div className="min-w-0"><p className="font-bold leading-tight">VaultSpend</p><p className="max-w-[150px] truncate text-xs text-slate-500 sm:max-w-none">{user.email}</p></div>{user.picture&&<img src={user.picture} alt="Google profile" className="h-9 w-9 rounded-full"/>}</div>
      <div className="flex items-center gap-2"><button onClick={()=>setDark(!dark)} aria-label="Toggle dark mode" className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button onClick={backup} disabled={busy} className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><CloudUpload size={17}/><span className="hidden sm:inline">{busy?'Syncing…':'Backup to Drive'}</span><span className="sm:hidden">Backup</span></button><button onClick={()=>{signOutLocal();setUser(null);setData(null);}} title="Sign out" className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"><LogOut size={18}/></button></div>
    </div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 pb-28 sm:px-6 sm:py-9"><Dashboard expenses={data.expenses} timeframe={timeframe} setTimeframe={setTimeframe} onAdd={()=>setExpenseOpen(true)}/></main>
    <button onClick={()=>setFabOpen(true)} aria-label="Add" className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/30 transition hover:scale-105"><Plus size={28}/></button>
    {fabOpen&&<div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5 dark:bg-slate-900"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Add new</h2><button onClick={()=>setFabOpen(false)}><X/></button></div><div className="grid gap-2"><button onClick={()=>{setFabOpen(false);setExpenseOpen(true);}} className="rounded-xl bg-violet-600 p-4 text-left font-semibold text-white">＋ Expense <span className="block text-xs font-normal text-violet-100">Record a new transaction</span></button><button onClick={()=>{setFabOpen(false);setAddType('Category');}} className="rounded-xl border border-slate-200 p-4 text-left font-semibold dark:border-slate-700">＋ Category <span className="block text-xs font-normal text-slate-500">Create a spending category</span></button><button onClick={()=>{setFabOpen(false);setAddType('For/With');}} className="rounded-xl border border-slate-200 p-4 text-left font-semibold dark:border-slate-700">＋ For / With <span className="block text-xs font-normal text-slate-500">Add a person or group</span></button></div></div></div>}
    {expenseOpen&&<ExpenseModal categories={data.categories} people={data.people} onClose={()=>setExpenseOpen(false)} onSave={addExpense}/>}
    {addType&&<AddItemModal type={addType} onClose={()=>setAddType(null)} onSave={addItem}/>}
    {importOpen&&<ImportPrompt onClose={()=>setImportOpen(false)} onImport={importRows}/>}
    {toast&&<div role="status" className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">{toast}</div>}
  </div>;
}
