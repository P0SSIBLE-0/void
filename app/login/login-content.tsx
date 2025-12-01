"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import * as motion from "motion/react-client";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPageContent() { // Renamed from LoginPage
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Welcome back!");
      router.refresh();
      router.push("/dashboard");
      
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl backdrop-blur-xl relative z-10"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto">
              <div className="w-3 h-3 bg-neutral-950 rounded-full" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-neutral-400">Enter the Void.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
                <label className="block text-sm font-medium text-neutral-400">Password</label>
                <a href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">Forgot password?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-neutral-950 font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
             {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
                <>
                 Log In <ArrowRight className="w-4 h-4" />
                </>
             )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
