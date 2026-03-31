export function normalizeUrl(rawInput) {
  const input = rawInput.trim()
  const withProtocol = /^https?:\/\//i.test(input)
    ? input
    : `https://${input}`

  const url = new URL(withProtocol)

  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase()
  url.hash = ''

  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = ''
  }

  const cleanedPath = url.pathname.replace(/\/+$/, '')
  url.pathname = cleanedPath || '/'

  url.searchParams.sort()

  return url.toString()
}

export function titleFromUrl(rawInput) {
  const input = rawInput.trim()
  const withProtocol = /^https?:\/\//i.test(input)
    ? input
    : `https://${input}`

  const url = new URL(withProtocol)
  return url.hostname.replace(/^www\./i, '')
}
