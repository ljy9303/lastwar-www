import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
      email: string
      name: string
      nickname?: string
      image?: string
      serverAllianceId?: number
      role?: string
      label?: string
      registrationComplete?: boolean
      serverInfo?: number
      allianceTag?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    accessToken?: string
    serverAllianceId?: number
    role?: string
    label?: string
    registrationComplete?: boolean
    serverInfo?: number
    allianceTag?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    serverAllianceId?: number
    role?: string
    label?: string
    registrationComplete?: boolean
    serverInfo?: number
    allianceTag?: string
  }
}