"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationControlsProps {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    pageSizeOptions?: number[]
}

export function PaginationControls({
    page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 30],
}: PaginationControlsProps) {
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1
    const to = Math.min(total, page * pageSize)

    return (
        <div className="flex items-center justify-between gap-4 flex-wrap px-1 pt-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{total === 0 ? "No results" : `${from}–${to} of ${total}`}</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="flex items-center gap-1.5">
                    Rows
                    <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                        <SelectTrigger size="sm" className="h-7 w-[64px] text-xs border-black/10 font-mono-ui">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((n) => (
                                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-mono-ui">Page {page} of {pageCount}</span>
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-black/10 text-neutral-500 hover:text-brand hover:border-brand/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pageCount}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-black/10 text-neutral-500 hover:text-brand hover:border-brand/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
