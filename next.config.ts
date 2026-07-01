import type { NextConfig } from "next"

const lemmaEnv = {
  apiUrl: process.env.NEXT_PUBLIC_LEMMA_API_URL || process.env.VITE_LEMMA_API_URL || "",
  authUrl: process.env.NEXT_PUBLIC_LEMMA_AUTH_URL || process.env.VITE_LEMMA_AUTH_URL || "",
  podId: process.env.NEXT_PUBLIC_LEMMA_POD_ID || process.env.VITE_LEMMA_POD_ID || "",
  orgId: process.env.NEXT_PUBLIC_LEMMA_ORG_ID || process.env.VITE_LEMMA_ORG_ID || "",
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_LEMMA_API_URL: lemmaEnv.apiUrl,
    NEXT_PUBLIC_LEMMA_AUTH_URL: lemmaEnv.authUrl,
    NEXT_PUBLIC_LEMMA_POD_ID: lemmaEnv.podId,
    NEXT_PUBLIC_LEMMA_ORG_ID: lemmaEnv.orgId,
  },
}

export default nextConfig
