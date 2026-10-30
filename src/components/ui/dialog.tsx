"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "@/components/icons"
import { cn } from "cn"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
 return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
 return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
 return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
 return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
 return (
 <DialogPrimitive.Backdrop
 data-slot="dialog-overlay"
 className={cn(
 "fixed inset-0 z-50 bg-scrim/50 duration-150 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
 className
 )}
 {...props}
 />
 )
}

function DialogContent({
 className,
 showCloseButton = true,
 children,
 ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
 return (
 <DialogPortal>
 <DialogOverlay />
 <DialogPrimitive.Popup
 data-slot="dialog-content"
 className={cn(
 "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border bg-popover p-6 text-popover-foreground shadow-overlay outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
 className
 )}
 {...props}
 >
 {children}
 {showCloseButton && (
 <DialogPrimitive.Close
 data-slot="dialog-close-button"
 aria-label="Close"
 className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full border bg-card/85 text-muted-foreground shadow-card backdrop-blur-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <X className="size-4" />
 </DialogPrimitive.Close>
 )}
 </DialogPrimitive.Popup>
 </DialogPortal>
 )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
 return (
 <DialogPrimitive.Title
 data-slot="dialog-title"
 className={cn("font-heading text-lg font-bold", className)}
 {...props}
 />
 )
}

function DialogDescription({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
 return (
 <DialogPrimitive.Description
 data-slot="dialog-description"
 className={cn("text-sm text-muted-foreground", className)}
 {...props}
 />
 )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
 return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

export {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogOverlay,
 DialogPortal,
 DialogTitle,
 DialogTrigger,
}
