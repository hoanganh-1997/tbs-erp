"use client";

import { useState } from "react";
import { initializeApp, type InitializeResult } from "@/lib/initialize-app";
import type { InitResult } from "@/lib/init-tables";
import type { SeedWaveResult } from "@/lib/seed-data/index";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Play,
  Sparkles,
  SkipForward,
} from "lucide-react";

export default function InitTablesPage() {
  const [results, setResults] = useState<InitResult[]>([]);
  const [seedResults, setSeedResults] = useState<SeedWaveResult[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  async function handleInit() {
    setRunning(true);
    setResults([]);
    setSeedResults([]);
    setPhase("running");
    setStatusMsg("Đang tạo bảng và dữ liệu demo...");

    try {
      // ONE server action call = ONE module scope = everything works
      const result = await initializeApp();

      if (result.tableResults) {
        setResults(result.tableResults);
      }
      if (result.seedResults) {
        setSeedResults(result.seedResults);
      }

      if (result.status === "already-done") {
        setStatusMsg("Hệ thống đã được khởi tạo trước đó!");
      } else if (result.status === "success") {
        setStatusMsg("Khởi tạo thành công!");
      } else if (result.status === "error") {
        setStatusMsg(`Lỗi: ${result.error}`);
      }
    } catch (err: any) {
      setResults((prev) => [
        ...prev,
        { table: "SYSTEM", status: "error", error: err.message },
      ]);
      setStatusMsg(`Lỗi: ${err.message}`);
    } finally {
      setRunning(false);
      setPhase("done");
    }
  }

  const tableOk = results.filter((r) => r.status === "ok").length;
  const tableErr = results.filter((r) => r.status === "error").length;
  const seedOk = seedResults.filter((r) => r.status === "ok").length;
  const seedSkipped = seedResults.filter((r) => r.status === "skipped").length;
  const seedErr = seedResults.filter((r) => r.status === "error").length;
  const totalRecords = seedResults.reduce((sum, r) => sum + r.recordCount, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2D3A8C]">
          Khởi tạo bảng dữ liệu
        </h1>
        <p className="text-gray-500 mt-1">
          Tạo tất cả bảng trong Inforact Base và thêm dữ liệu demo.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-[#4F5FD9]" />
          <span className="font-medium">30 bảng + dữ liệu demo</span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Nhấn nút bên dưới để tạo tất cả bảng và seed dữ liệu demo.
          Bảng đã tồn tại sẽ được bỏ qua (không tạo trùng).
          Dữ liệu chỉ seed nếu chưa có.
        </p>

        {statusMsg && phase === "done" && (
          <div className={`text-sm mb-4 px-3 py-2 rounded ${
            statusMsg.startsWith("Lỗi") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {statusMsg}
          </div>
        )}

        <button
          onClick={handleInit}
          disabled={running}
          className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang khởi tạo...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Khởi tạo tất cả
            </>
          )}
        </button>
      </div>

      {/* Table creation results */}
      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">Tạo bảng</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                {tableOk} thành công
              </span>
              {tableErr > 0 && (
                <span className="text-red-600 font-medium">
                  {tableErr} lỗi
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.table}
                className="px-4 py-2 flex items-center justify-between text-sm"
              >
                <span className="font-mono text-gray-700">{r.table}</span>
                {r.status === "ok" ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    OK
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1.5 text-red-600 max-w-xs truncate"
                    title={r.error}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    {r.error || "Error"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seed data results */}
      {seedResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Seed dữ liệu demo</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {seedOk > 0 && (
                <span className="text-green-600 font-medium">
                  {seedOk} wave OK
                </span>
              )}
              {seedSkipped > 0 && (
                <span className="text-amber-600 font-medium">
                  {seedSkipped} đã có data
                </span>
              )}
              {seedErr > 0 && (
                <span className="text-red-600 font-medium">
                  {seedErr} lỗi
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {seedResults.map((r) => (
              <div
                key={r.wave}
                className="px-4 py-2.5 flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{r.wave}</span>
                <div className="flex items-center gap-2">
                  {r.status === "ok" && (
                    <>
                      <span className="text-gray-500">
                        {r.recordCount} records
                      </span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    </>
                  )}
                  {r.status === "skipped" && (
                    <>
                      <span className="text-amber-600 text-xs">
                        đã có data
                      </span>
                      <SkipForward className="w-3.5 h-3.5 text-amber-500" />
                    </>
                  )}
                  {r.status === "error" && (
                    <span
                      className="flex items-center gap-1.5 text-red-600 max-w-xs truncate"
                      title={r.error}
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      {r.error || "Error"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalRecords > 0 && phase === "done" && (
            <div className="bg-green-50 px-4 py-3 text-sm text-green-800 font-medium border-t border-green-100">
              Tổng cộng: {totalRecords} records đã tạo trong Inforact Base
            </div>
          )}
        </div>
      )}
    </div>
  );
}
