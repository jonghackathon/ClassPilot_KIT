export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: AdminSidebar */}
      <div className="flex-1">
        {/* TODO: TopBar */}
        <main className="mx-auto max-w-[1440px] p-6 bg-slate-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
