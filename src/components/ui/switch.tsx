"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-white/10 focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-white/10 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent shadow-sm transition-all duration-300 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:shadow-md data-[state=checked]:shadow-primary/30",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white dark:data-[state=unchecked]:bg-foreground/60 dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4.5 rounded-full ring-0 transition-all duration-300 data-[state=checked]:translate-x-[calc(100%-1px)] data-[state=unchecked]:translate-x-0 shadow-sm"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }