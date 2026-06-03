import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let profile = null
    try {
      profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        displayName: profile?.displayName || user.user_metadata?.full_name || "",
        email: user.email || "",
        dateOfBirth: profile?.dateOfBirth?.toISOString().split("T")[0] || "",
        country: profile?.country || "",
        educationLevel: profile?.educationLevel || "",
        major: profile?.major || "",
        targetDegree: profile?.targetDegree || "",
        englishLevel: profile?.englishLevel || "",
        englishScore: profile?.englishScore?.toString() || "",
        gpa: profile?.gpa?.toString() || "",
        hasWorkExperience: profile?.hasWorkExperience || false,
        workYears: profile?.workYears?.toString() || "",
        hasResearch: profile?.hasResearch || false,
        budget: profile?.budget || "",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 })
  }
}

async function upsertProfile(userId: string, body: Record<string, unknown>) {
  const data = {
    displayName: (body.displayName as string) || "",
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : new Date(),
    country: (body.country as string) || "",
    educationLevel: (body.educationLevel as string) || "",
    major: (body.major as string) || null,
    targetDegree: (body.targetDegree as string) || "",
    englishLevel: (body.englishLevel as string) || "",
    englishScore: body.englishScore ? parseInt(body.englishScore as string) : null,
    gpa: body.gpa ? parseFloat(body.gpa as string) : null,
    hasWorkExperience: !!body.hasWorkExperience,
    workYears: body.workYears ? parseInt(body.workYears as string) : null,
    hasResearch: !!body.hasResearch,
    budget: (body.budget as string) || null,
  }

  // Ensure User record exists before creating UserProfile (FK constraint)
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: (body.email as string) || null, name: body.displayName as string || null },
    update: { name: body.displayName as string || undefined },
  })

  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data } as any,
    update: data as any,
  })

}

async function redeemReferralCode(userId: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const code = user.user_metadata?.referral_code
    if (!code || typeof code !== "string") return

    const referral = await prisma.referralCode.findUnique({ where: { code } })
    if (!referral || referral.usedCount >= referral.maxUses) return

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { reviewCredits: { increment: referral.credits } },
      }),
      prisma.payment.create({
        data: {
          userId,
          amount: 0,
          credits: referral.credits,
          status: "approved",
        },
      }),
      prisma.referralCode.update({
        where: { id: referral.id },
        data: { usedCount: { increment: 1 } },
      }),
    ])

    // Clear the referral code from metadata so it's not redeemed again
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const meta = { ...user.user_metadata }
    delete meta.referral_code
    await admin.auth.admin.updateUserById(user.id, { user_metadata: meta })
  } catch {
    // Referral table may not exist yet — don't block profile creation
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await upsertProfile(user.id, body)
    await redeemReferralCode(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await upsertProfile(user.id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
