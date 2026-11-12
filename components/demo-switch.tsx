import { demoLoginAction } from '@/lib/actions';
import type { DemoAccount } from '@/lib/types';

export function DemoSwitch({ accounts, currentId }: { accounts: DemoAccount[]; currentId: string }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(20,36,28,0.04)]">
      <h2 className="text-base font-semibold">Demo role switcher</h2>
      <p className="mt-1 text-sm text-[#5C6B63]">Sample Lusaka accounts. Every demo PIN is 1234. This is demo data, not a live fleet.</p>
      <div className="mt-3 space-y-2">
        {accounts.map((account) => (
          <form key={account.id} action={demoLoginAction}>
            <input type="hidden" name="userId" value={account.id} />
            <button
              type="submit"
              disabled={account.id === currentId}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[#E7E1D6] px-4 text-left disabled:bg-[#F3F1EB]"
            >
              <span>
                <span className="block font-semibold">{account.shortName}</span>
                <span className="block text-xs capitalize text-[#5C6B63]">{account.role} · {account.detail}</span>
              </span>
              <span className="text-sm text-[#0B5D3B]">{account.id === currentId ? 'Signed in' : 'Switch'}</span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
