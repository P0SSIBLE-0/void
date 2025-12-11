import Link from "next/link";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="logo" className="size-8 mr-2" />
          <span className="text-lg font-bold tracking-tighter text-white">Void</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-white text-neutral-950 px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
};
