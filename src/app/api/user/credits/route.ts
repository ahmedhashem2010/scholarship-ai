import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

    return NextResponse.json({
      success: true,
      credits: dbUser?.reviewCredits ?? 0,
    })
  } catch {
    return NextResponse.json({ success: false, credits: 0 }, { status: 500 })
  }
}
