import { WalletCards, ShieldCheck } from 'lucide-react';

export default function SignIn({ onSignIn, busy }: { onSignIn: () => void; busy: boolean }) {
  return <main className="min-h-screen grid place-items-center px-5 bg-slate-950 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
      <div className="mb-8 flex items-center gap-3"><div className="rounded-2xl bg-violet-500 p-3"><WalletCards size={26}/></div><div><h1 className="text-2xl font-bold">VaultSpend</h1><p className="text-sm text-slate-400">Your money, clearly organised.</p></div></div>
      <h2 className="text-3xl font-semibold tracking-tight">Spend with clarity.</h2>
      <p className="mt-3 leading-6 text-slate-400">Track expenses privately, even when you’re offline. Your data stays in this browser until you choose to back it up.</p>
      <button disabled={busy} onClick={onSignIn} className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 disabled:opacity-60">
        <span className="text-lg font-bold text-blue-600">G</span>{busy ? 'Connecting…' : 'Sign in with Google'}
      </button>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/> Google Drive access is used only for your VaultSpend backup.</div>
    </section>
  </main>;
}
