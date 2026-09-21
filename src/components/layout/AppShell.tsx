import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
