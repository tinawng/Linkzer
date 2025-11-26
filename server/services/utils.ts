export function deleteURLSearchParams(url: URL): URL {
  for (const [key] of [...url.searchParams.entries()]) url.searchParams.delete(key)
  return url
}
