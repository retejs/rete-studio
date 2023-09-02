import { usePathname, useRouter, useSearchParams as useSP } from 'next/navigation'

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  const searchParams = typeof window !== 'undefined' ? useSP() : null

  return [searchParams, (list: (readonly [string, string | null])[]) => {
    const nextParams = [
      ...Array.from(searchParams?.entries() || []).filter(([key]) => !list.map(([k]) => k).includes(key)),
      ...(list.filter(([, value]) => value !== null).map(([key, value]) => [key, value]) as [string, string][])
    ]
    const current = new URLSearchParams(nextParams);

    router.push(`${pathname}?${current.toString()}`);
  }] as const
}
