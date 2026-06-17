import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
}

export const Pagination = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = 'mục',
  className = ''
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  // Compact page window around the current page
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = Math.max(1, end - 4); i <= end; i++) pages.push(i)

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
        <span>Hiển thị <span className="text-gray-900 font-black">{from}–{to}</span> / {total} {itemLabel}</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-black text-gray-700"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}/trang</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-primary/40 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-black transition-colors ${
              p === current ? 'chinese-gradient border-transparent text-white shadow' : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-primary/40 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
