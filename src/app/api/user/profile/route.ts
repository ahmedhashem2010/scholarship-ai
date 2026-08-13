import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/api-auth"
import { unauthorized } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    // No try/catch around the Prisma call on purpose. A DB failure must surface
    // as an error (500), NOT as an empty profile — otherwise the dashboard
    // treats a slow/failed lookup as "this student has no profile" and bounces
    // them into onboarding, which then bounces them back, and so on.
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })

    // Signup stores the name under `user_metadata.name`; some legacy accounts
    // used `full_name`. Check both before giving up on the fallback.
    const metaName =
      typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : ""

    return NextResponse.json({
      success: true,
      exists: !!profile,
      data: {
        displayName: profile?.displayName || metaName || "",
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
    console.error("[profile] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to load profile" }, { status: 500 })
  }
}

async function upsertProfile(userId: string, userEmail: string | undefined, body: Record<string, unknown>) {
  const data = {
    displayName: (body.displayName as string) || "",
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : new Date(),
    country: (body.country as string) || "",
    educationLevel: (body.educationLevel as string) || "",
    major: (body.major as string) || null,
    targetDegree: (body.targetDegree as string) || "",
    englishLevel: (body.englishLevel as string) || "",
    // IELTS scores are half-points (6.5), so parse as float, never int.
    englishScore: body.englishScore ? parseFloat(body.englishScore as string) : null,

    // --- English testing ----------------------------------------------------
    // The question that actually decides eligibility isn't "how good is your
    // English" — it's "do you HAVE a test score, and if not, will you sit one?"
    // A student who prefers scholarships with no English requirement is a real
    // and underserved segment, so it's a first-class answer here.
    hasEnglishTest: (body.hasEnglishTest as string) || null,
    englishTestType: (body.englishTestType as string) || null,
    englishTestDate: body.englishTestDate ? new Date(body.englishTestDate as string) : null,
    testTimeframe: (body.testTimeframe as string) || null,

    nationality: (body.nationality as string) || null,
    // Without a scale, a GPA is meaningless — 3.5 is excellent on 4.0 and
    // mediocre on 5.0. The old code stored a bare float and silently compared
    // it against scholarship minimums that assume 4.0.
    gpaScale: (body.gpaScale as string) || null,
    graduationYear: body.graduationYear ? parseInt(body.graduationYear as string) : null,
    preferredCountries: Array.isArray(body.preferredCountries)
      ? (body.preferredCountries as string[])
      : [],

    gpa: body.gpa ? parseFloat(body.gpa as string) : null,
    hasWorkExperience: !!body.hasWorkExperience,
    workYears: body.workYears ? parseInt(body.workYears as string) : null,
    hasResearch: !!body.hasResearch,
    budget: (body.budget as string) || null,
  }

  // Ensure User record exists before creating UserProfile (FK constraint).
  // The email is ALWAYS derived from the authenticated Supabase session — the
  // client-supplied value is ignored. Accepting body.email let any user write
  // the admin's address into the DB and escalate the /api/users admin gate,
  // so the DB column is never trusted for authorization.
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: userEmail || null, name: body.displayName as string || null },
    update: {
      name: body.displayName as string || undefined,
      // Self-heal legacy rows toward the authoritative session email.
      email: userEmail || undefined,
    },
  })

  // The update branch must NOT clobber fields the request didn't send. The
  // profile edit page submits a partial body (it has no controls for
  // hasEnglishTest / englishTestType / englishTestDate / testTimeframe, and
  // only sends englishScore when it's non-empty), so a one-field edit used to
  // null every English-test answer out of the profile. Omitting a key from the
  // update leaves the stored value untouched; sending a value (even null)
  // still clears it.
  const updateData = { ...data }
  for (const key of ["hasEnglishTest", "englishTestType", "englishTestDate", "testTimeframe", "englishScore"] as const) {
    if (body[key] === undefined) delete updateData[key]
  }

  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data } as any,
    update: updateData as any,
  })

}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const body = await request.json()
    await upsertProfile(user.id, user.email, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const body = await request.json()
    await upsertProfile(user.id, user.email, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
