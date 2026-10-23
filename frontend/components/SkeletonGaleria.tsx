export function SkeletonGaleria() {
  return (
    <ul
      aria-busy="true"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-site-roxo/10 bg-white p-8"
        >
          <div className="h-24 w-24 animate-pulse rounded-full bg-site-roxo/10" />
          <div className="mt-2 h-6 w-3/4 animate-pulse rounded bg-site-roxo/10" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-site-roxo/10" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-site-roxo/10" />
        </li>
      ))}
    </ul>
  )
}