"use client";

import { useEffect, useState, useRef } from "react";
import { initializeApp } from "@/lib/initialize-app";
import { Loader2, Database, XCircle, CheckCircle } from "lucide-react";

type Phase = "initializing" | "ready" | "error";

/**
 * Wraps the entire app. On first render, calls a SINGLE server action
 * that checks tables, creates missing ones, and seeds data.
 *
 * ONE server action call = ONE module scope = table registry cache works.
 */
export function AutoInitProvider({ children }: { children: React.ReactNode }) {
  // const skipInit = process.env.NEXT_PUBLIC_SKIP_INIT === "true";
  const skipInit = true;
  const [phase, setPhase] = useState<Phase>(skipInit ? "ready" : "initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const initStarted = useRef(false);

  useEffect(() => {
    if (skipInit) return;
    // Prevent double-init in React StrictMode / HMR
    if (initStarted.current) return;
    initStarted.current = true;

    let mounted = true;

    async function run() {
      try {
        // ONE server action call does everything:
        // check → create tables → seed data
        const result = await initializeApp();

        if (!mounted) return;

        if (result.status === "already-done" || result.status === "success") {
          setPhase("ready");
          return;
        }

        if (result.status === "partial") {
          // Some non-critical tables failed but enough to run
          setPhase("ready");
          return;
        }

        // Error
        setErrorMsg(result.error || "Lỗi không xác định khi khởi tạo");
        setPhase("error");
      } catch (err: any) {
        if (!mounted) return;
        setErrorMsg(err?.message || String(err));
        setPhase("error");
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (phase === "ready") {
    return <>{children}</>;
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="text-center space-y-4 max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold text-gray-900">Lỗi khởi tạo</h2>
          <p className="text-sm text-gray-500 whitespace-pre-wrap">
            {errorMsg || "Không thể kết nối đến Inforact Base"}
          </p>
          <button
            onClick={() => {
              initStarted.current = false;
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Initializing phase
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50/50">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <Database className="w-16 h-16 text-[#4F5FD9]/20" />
          <Loader2 className="w-8 h-8 text-[#4F5FD9] animate-spin absolute top-4 left-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Đang khởi tạo hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tạo bảng và dữ liệu demo, vui lòng đợi...
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-[#4F5FD9] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-[#4F5FD9] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-[#4F5FD9] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
