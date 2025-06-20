"use client";
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center">
      <SignIn 
        redirectUrl="/dashboard" 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-slate-900/50 border border-slate-800 backdrop-blur-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
            formFieldInput: "bg-white/10 border-white/20 text-white",
            formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400",
            footerActionLink: "text-emerald-400 hover:text-emerald-300"
          }
        }}
        initialValues={{
          emailAddress: email || ""
        }}
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
} 