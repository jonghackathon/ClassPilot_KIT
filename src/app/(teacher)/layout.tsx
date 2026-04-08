export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* TODO: TopBar + TeacherTabNav */}
      <main className="mx-auto max-w-[1200px] p-6 bg-slate-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
