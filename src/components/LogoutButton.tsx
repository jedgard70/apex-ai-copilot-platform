"use client";
import { useAuth0 } from '@auth0/auth0-react';
export default function LogoutButton() {
  const { logout } = useAuth0();
  return (
    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className="w-full text-center inline-block px-6 py-3 bg-white/[0.04] hover:bg-red-500/10 text-slate-300 hover:text-red-400 font-medium rounded-2xl text-[15px] tracking-[-0.01em] border border-white/[0.08] hover:border-red-500/20 transition-all duration-200 focus:outline-none">
      Sign out
    </button>
  );
}
