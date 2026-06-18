export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100">
      {children}
    </div>
  );
}
