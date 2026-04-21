import "./globals.css";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { AutoInitProvider } from "@/components/auto-init-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <AutoInitProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
              <div className="p-6 max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </AutoInitProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
