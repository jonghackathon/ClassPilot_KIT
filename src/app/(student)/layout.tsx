export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TODO: MiniTopBar */}
      <main className="mx-auto max-w-[640px] px-4 pb-20 pt-4">
        {children}
      </main>
      {/* TODO: StudentBottomTab */}
    </div>
  )
}
