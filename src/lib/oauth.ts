import { createHmac, randomBytes } from 'crypto'

/**
 * Percent-encode a string per RFC 3986
 */
export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

/**
 * Generate OAuth 1.0 signature
 */
export function generateOAuthSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // Create parameter string (sorted alphabetically by key)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join('&')

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&')

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(
    tokenSecret
  )}`

  // Generate HMAC-SHA1 signature
  const hmac = createHmac('sha1', signingKey)
  hmac.update(signatureBaseString)
  const signature = hmac.digest('base64')

  return signature
}

/**
 * Generate OAuth 1.0 Authorization header
 */
export function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  oauthToken: string,
  tokenSecret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomBytes(16).toString('base64').replace(/\W/g, '')

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_token: oauthToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  }

  // Generate signature
  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    tokenSecret
  )

  // Add signature to params
  oauthParams.oauth_signature = signature

  // Build Authorization header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((key) => `${key}="${percentEncode(oauthParams[key])}"`)
    .join(',')

  return `OAuth ${headerParts}`
}
