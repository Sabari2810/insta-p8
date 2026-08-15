"use client"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FiMenu as Menu } from "react-icons/fi"
import { Sidebar } from "@/components/layout/sidebar"
import { useState } from "react"

export interface MobileNavProps {
    username?: string
    profilePic?: string | null
    onLogout?: () => void
}

export function MobileNav({ username, profilePic, onLogout }: MobileNavProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-black/10 bg-white w-72">
                <Sidebar
                    className="h-full border-none bg-transparent"
                    username={username}
                    profilePic={profilePic}
                    onLogout={onLogout}
                    onNavigate={() => setOpen(false)}
                />
            </SheetContent>
        </Sheet>
    )
}
