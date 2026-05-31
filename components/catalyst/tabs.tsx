'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React from 'react'

export function Tabs({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Headless.TabGroup>) {
  return (
    <Headless.TabGroup
      {...props}
      className={clsx(className, 'flex w-full flex-col')}
    />
  )
}

export function TabList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Headless.TabList>) {
  return (
    <Headless.TabList
      {...props}
      className={clsx(
        className,
        'grid w-full grid-cols-2',
      )}
    />
  )
}

export function Tab({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Headless.Tab>) {
  return (
    <Headless.Tab
      {...props}
      className={clsx(
        className,
        // Base: equal-width tab cell with Chrome-like boundaries
        'relative flex min-w-0 items-center justify-center px-4 py-3 text-sm/6 font-semibold outline-hidden transition-colors',
        'border border-zinc-950/10 bg-zinc-100/90 text-zinc-500',
        'data-hover:bg-zinc-50 data-hover:text-zinc-700',
        'dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-400 dark:data-hover:bg-zinc-800/70 dark:data-hover:text-zinc-300',
        // Active tab connects to the panel below
        'data-selected:z-10 data-selected:-mb-px data-selected:border-b-white data-selected:bg-white data-selected:text-zinc-950',
        'dark:data-selected:border-b-zinc-900 dark:data-selected:bg-zinc-900 dark:data-selected:text-white',
        // Corner rounding per position
        'first:rounded-tl-lg last:rounded-tr-lg',
        // Shared vertical divider between tabs
        'not-first:border-l-0',
      )}
    >
      {children}
    </Headless.Tab>
  )
}

export function TabPanels({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Headless.TabPanels>) {
  return (
    <Headless.TabPanels
      {...props}
      className={clsx(
        className,
        'rounded-b-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900',
      )}
    />
  )
}

export function TabPanel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Headless.TabPanel>) {
  return (
    <Headless.TabPanel
      {...props}
      className={clsx(className, 'p-6 focus:outline-hidden sm:p-8')}
    />
  )
}
