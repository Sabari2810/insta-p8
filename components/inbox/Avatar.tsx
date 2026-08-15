"use client"

import { useState } from "react"
import { FiUser as UserCircle } from "react-icons/fi"
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
                    "rounded-full bg-black/[0.04] border border-black/10 flex items-center justify-center shrink-0",
                    className,
                )}
                style={{ width: size, height: size }}
            >
                <UserCircle className="text-neutral-400" style={{ width: size * 0.5, height: size * 0.5 }} />
            </div>
        )
    }

    return (
        <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setErrored(true)}
            className={cn("rounded-full object-cover shrink-0 bg-black/[0.04] border border-black/10", className)}
            style={{ width: size, height: size }}
        />
    )
}
