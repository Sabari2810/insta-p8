"use client"

import { useState } from "react"
import { UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarProps {
    src?: string | null
    size?: number
    className?: string
}

// Instagram's profile_pic URLs expire after a few days, so a stale one loading a broken image is
// expected, not a bug — falls back to a generic icon instead of showing a broken-image glyph.
export function Avatar({ src, size = 48, className }: AvatarProps) {
    const [errored, setErrored] = useState(false)

    if (!src || errored) {
        return (
            <div
                className={cn(
                    "rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0",
                    className,
                )}
                style={{ width: size, height: size }}
            >
                <UserCircle className="text-white/50" style={{ width: size * 0.5, height: size * 0.5 }} />
            </div>
        )
    }

    return (
        <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setErrored(true)}
            className={cn("rounded-full object-cover shrink-0 bg-white/[0.06] border border-white/10", className)}
            style={{ width: size, height: size }}
        />
    )
}
