"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Pause, ChevronRight } from "lucide-react";

// --- Confirm Status Transition Dialog ---

interface ConfirmTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  fromStatus: string;
  toStatus: string;
}

export function ConfirmTransitionDialog({
  open,
  onClose,
  onConfirm,
  loading,
  fromStatus,
  toStatus,
}: ConfirmTransitionDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Chuyển trạng thái
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc muốn chuyển trạng thái đơn hàng từ{" "}
          <span className="font-semibold text-gray-800">&ldquo;{fromStatus}&rdquo;</span> sang{" "}
          <span className="font-semibold text-gray-800">&ldquo;{toStatus}&rdquo;</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3d4cc0] disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Cancel Order Dialog ---

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

export function CancelOrderDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const isValid = reason.trim().length >= 20;

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Hủy đơn hàng
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Hành động này không thể hoàn tác. Vui lòng nhập lý do hủy đơn (tối
          thiểu 20 ký tự).
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Nhập lý do hủy đơn hàng..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
        />
        <div className="text-xs text-gray-400 mt-1 mb-4">
          {reason.trim().length}/20 ký tự tối thiểu
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={loading || !isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Hold Order Dialog ---

interface HoldDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading: boolean;
}

export function HoldOrderDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: HoldDialogProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Pause className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tạm giữ đơn hàng
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Đơn hàng sẽ bị tạm giữ cho đến khi được mở lại.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Ghi chú lý do tạm giữ (không bắt buộc)..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm(note.trim())}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Tạm giữ"}
          </button>
        </div>
      </div>
    </div>
  );
}
