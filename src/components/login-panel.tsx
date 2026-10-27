"use client";

import { useState } from "react";
import { login, signup } from "@/app/actions";
import { field, btn } from "@/components/ui";

export function LoginPanel({
  error,
  sent,
  initialForm,
}: {
  error: string;
  sent: boolean;
  initialForm: "login" | "signup";
}) {
  const [form, setForm] = useState(initialForm);
  const showError = error && form === initialForm;

  return (
    <div className="live-rise w-full max-w-[440px]">
      <p className="text-center text-sm font-medium tracking-[0.18em] text-[#1c2c86] uppercase">LiveCentral</p>
      <h1 className="mt-2 text-center text-[1.7rem] leading-snug font-medium text-[#1a1a1a]">
        Central Category & Product
        <span className="block">Database System</span>
      </h1>
      <p className="mt-3 text-center text-sm leading-6 text-[#5d6880]">
        All Websites. All Categories. One Central Database.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-[0_8px_24px_rgba(28,44,134,0.08)] backdrop-blur">
        <button
          type="button"
          onClick={() => setForm("login")}
          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${form === "login" ? "bg-[#1c2c86] text-white" : "text-[#5d6880] hover:bg-[#f4f6fb]"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setForm("signup")}
          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${form === "signup" ? "bg-[#1c2c86] text-white" : "text-[#5d6880] hover:bg-[#f4f6fb]"}`}
        >
          Sign up
        </button>
      </div>

      <div key={form} className="live-rise mt-4 rounded-3xl border border-white/80 bg-white/95 px-7 py-8 shadow-[0_20px_50px_rgba(28,44,134,0.12)] backdrop-blur">
        {form === "login" ? (
          <form action={login}>
            <p className="text-center text-sm leading-6 text-[#5d6880]">
              Naam aur email likhein. Sirf approved account login hota hai.
            </p>
            {showError ? (
              <p className="mt-5 rounded-xl border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-center text-sm text-[#c62828]">{error}</p>
            ) : null}
            <label className="mt-6 block text-sm font-medium text-[#1a1a1a]">
              Name
              <input name="name" required autoComplete="name" placeholder="Aap ka naam" className={`${field} mt-1.5 px-4 py-3`} />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#1a1a1a]">
              Email
              <input name="email" type="email" required autoComplete="email" placeholder="name@email.com" className={`${field} mt-1.5 px-4 py-3`} />
            </label>
            <button type="submit" className={`${btn} mt-6 w-full py-3`}>Login</button>
          </form>
        ) : (
          <form action={signup}>
            <p className="text-center text-sm leading-6 text-[#5d6880]">
              Request bhejein. Account tab banega jab approve ho. Approver role Edit ya View set kar sakta hai.
            </p>
            {sent && form === "signup" ? (
              <p className="mt-5 rounded-xl border border-[#c9e8d4] bg-[#f3fbf6] px-4 py-3 text-center text-sm text-[#1b7a3a]">
                Request chali gayi. Approve hone ke baad isi naam aur email se login kar sakte hain.
              </p>
            ) : null}
            {showError ? (
              <p className="mt-5 rounded-xl border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-center text-sm text-[#c62828]">{error}</p>
            ) : null}
            <label className="mt-6 block text-sm font-medium text-[#1a1a1a]">
              Name
              <input name="name" required autoComplete="name" placeholder="Aap ka naam" className={`${field} mt-1.5 px-4 py-3`} />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#1a1a1a]">
              Email
              <input name="email" type="email" required autoComplete="email" placeholder="name@email.com" className={`${field} mt-1.5 px-4 py-3`} />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#1a1a1a]">
              Role
              <select name="role" required defaultValue="edit" className={`${field} mt-1.5 px-4 py-3`}>
                <option value="edit">Edit — category aur product change kar sakte hain</option>
                <option value="view">View — sirf dekh sakte hain</option>
              </select>
            </label>
            <button type="submit" className={`${btn} mt-6 w-full py-3`}>Send request</button>
          </form>
        )}
      </div>
    </div>
  );
}
