"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectItem,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Loader2, Save, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { t, pick } = useLanguage()
  const { addToast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    dateOfBirth: "",
    country: "",
    educationLevel: "",
    major: "",
    targetDegree: "",
    englishLevel: "",
    englishScore: "",
    gpa: "",
    hasWorkExperience: false,
    workYears: "",
    hasResearch: false,
    budget: "",
  })

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setProfile((prev) => ({ ...prev, email: user.email ?? "" }))
      }
      const response = await fetch("/api/user/profile")
      const result = await response.json()
      if (result.success && result.data) {
        setProfile((prev) => ({ ...prev, ...result.data }))
      }
    } catch {
      addToast("error", pick("فشل تحميل الملف الشخصي", "Failed to load profile"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      const result = await response.json()

      if (result.success) {
        addToast("success", pick("تم تحديث الملف الشخصي بنجاح!", "Profile updated successfully!"))
        router.push("/dashboard")
      } else {
        throw new Error(result.error || pick("فشل التحديث", "Failed to update"))
      }
    } catch {
      addToast("error", pick("فشل تحديث الملف الشخصي", "Failed to update profile"))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{pick("ملفي الشخصي", "My Profile")}</h1>
            <p className="text-muted-foreground">
              {pick("أدر بياناتك الشخصية والمعلومات الأكاديمية", "Manage your personal details and academic information")}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pick("المعلومات الشخصية", "Personal Information")}</CardTitle>
          <CardDescription>
            {pick("حدّث بياناتك الشخصية ومعلوماتك الأكاديمية", "Update your personal details and academic information")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("onb.fullName")}</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder={pick("أدخل اسمك الكامل", "Enter your full name")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{pick("البريد الإلكتروني", "Email")}</Label>
              <Input id="email" type="email" value={profile.email} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t("onb.dob")}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{pick("البلد", "Country")}</Label>
              <Select value={profile.country} onValueChange={(value: string) => handleChange("country", value)}>
                <SelectItem value="Egypt">{pick("مصر", "Egypt")}</SelectItem>
                <SelectItem value="Saudi Arabia">{pick("السعودية", "Saudi Arabia")}</SelectItem>
                <SelectItem value="UAE">{pick("الإمارات", "UAE")}</SelectItem>
                <SelectItem value="Jordan">{pick("الأردن", "Jordan")}</SelectItem>
                <SelectItem value="Lebanon">{pick("لبنان", "Lebanon")}</SelectItem>
                <SelectItem value="Iraq">{pick("العراق", "Iraq")}</SelectItem>
                <SelectItem value="Syria">{pick("سوريا", "Syria")}</SelectItem>
                <SelectItem value="Yemen">{pick("اليمن", "Yemen")}</SelectItem>
                <SelectItem value="Oman">{pick("عُمان", "Oman")}</SelectItem>
                <SelectItem value="Qatar">{pick("قطر", "Qatar")}</SelectItem>
                <SelectItem value="Bahrain">{pick("البحرين", "Bahrain")}</SelectItem>
                <SelectItem value="Kuwait">{pick("الكويت", "Kuwait")}</SelectItem>
                <SelectItem value="Palestine">{pick("فلسطين", "Palestine")}</SelectItem>
                <SelectItem value="Algeria">{pick("الجزائر", "Algeria")}</SelectItem>
                <SelectItem value="Morocco">{pick("المغرب", "Morocco")}</SelectItem>
                <SelectItem value="Tunisia">{pick("تونس", "Tunisia")}</SelectItem>
                <SelectItem value="Libya">{pick("ليبيا", "Libya")}</SelectItem>
                <SelectItem value="Sudan">{pick("السودان", "Sudan")}</SelectItem>
                <SelectItem value="Mauritania">{pick("موريتانيا", "Mauritania")}</SelectItem>
                <SelectItem value="Somalia">{pick("الصومال", "Somalia")}</SelectItem>
                <SelectItem value="Djibouti">{pick("جيبوتي", "Djibouti")}</SelectItem>
                <SelectItem value="Comoros">{pick("جزر القمر", "Comoros")}</SelectItem>
                <SelectItem value="Other">{pick("أخرى", "Other")}</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationLevel">{pick("المستوى التعليمي الحالي", "Current Education")}</Label>
              <Select value={profile.educationLevel} onValueChange={(value: string) => handleChange("educationLevel", value)}>
                <SelectItem value="high-school">{pick("الثانوية العامة", "High School")}</SelectItem>
                <SelectItem value="bachelor">{pick("درجة البكالوريوس", "Bachelor's Degree")}</SelectItem>
                <SelectItem value="master">{pick("درجة الماجستير", "Master's Degree")}</SelectItem>
                <SelectItem value="phd">{pick("الدكتوراه", "PhD / Doctorate")}</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">{pick("مجال الدراسة", "Field of Study")}</Label>
              <Select value={profile.major} onValueChange={(value: string) => handleChange("major", value)}>
                <SelectItem value="Computer Science">{pick("علوم الحاسوب", "Computer Science")}</SelectItem>
                <SelectItem value="Engineering">{pick("الهندسة", "Engineering")}</SelectItem>
                <SelectItem value="Medicine">{pick("الطب", "Medicine")}</SelectItem>
                <SelectItem value="Business">{pick("إدارة الأعمال", "Business")}</SelectItem>
                <SelectItem value="Law">{pick("القانون", "Law")}</SelectItem>
                <SelectItem value="Economics">{pick("الاقتصاد", "Economics")}</SelectItem>
                <SelectItem value="Arts & Humanities">{pick("الفنون والعلوم الإنسانية", "Arts & Humanities")}</SelectItem>
                <SelectItem value="Natural Sciences">{pick("العلوم الطبيعية", "Natural Sciences")}</SelectItem>
                <SelectItem value="Social Sciences">{pick("العلوم الاجتماعية", "Social Sciences")}</SelectItem>
                <SelectItem value="Education">{pick("التربية", "Education")}</SelectItem>
                <SelectItem value="Agriculture">{pick("الزراعة", "Agriculture")}</SelectItem>
                <SelectItem value="Architecture">{pick("العمارة", "Architecture")}</SelectItem>
                <SelectItem value="Pharmacy">{pick("الصيدلة", "Pharmacy")}</SelectItem>
                <SelectItem value="Dentistry">{pick("طب الأسنان", "Dentistry")}</SelectItem>
                <SelectItem value="Nursing">{pick("التمريض", "Nursing")}</SelectItem>
                <SelectItem value="Information Technology">{pick("تقنية المعلومات", "Information Technology")}</SelectItem>
                <SelectItem value="Other">{pick("أخرى", "Other")}</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDegree">{pick("الدرجة المستهدفة", "Target Degree")}</Label>
              <Select value={profile.targetDegree} onValueChange={(value: string) => handleChange("targetDegree", value)}>
                <SelectItem value="bachelor">{pick("بكالوريوس", "Bachelor's")}</SelectItem>
                <SelectItem value="master">{pick("ماجستير", "Master's")}</SelectItem>
                <SelectItem value="phd">{pick("دكتوراه", "PhD")}</SelectItem>
                <SelectItem value="exchange">{pick("برنامج تبادل", "Exchange Program")}</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpa">{pick("المعدل التراكمي", "GPA")}</Label>
              <Input id="gpa" type="number" step="0.01" value={profile.gpa} onChange={(e) => handleChange("gpa", e.target.value)} placeholder={pick("مثال: 3.5", "e.g., 3.5")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="englishLevel">{pick("مستوى الإنجليزية", "English Level")}</Label>
              <Select value={profile.englishLevel} onValueChange={(value: string) => handleChange("englishLevel", value)}>
                <SelectItem value="beginner">{pick("مبتدئ", "Beginner")}</SelectItem>
                <SelectItem value="intermediate">{pick("متوسط", "Intermediate")}</SelectItem>
                <SelectItem value="advanced">{pick("متقدم", "Advanced")}</SelectItem>
                <SelectItem value="fluent">{pick("طليق", "Fluent")}</SelectItem>
                <SelectItem value="native">{pick("اللغة الأم", "Native")}</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="IELTS">IELTS</SelectItem>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {pick("جارِ الحفظ…", "Saving...")}</>
              ) : (
                <><Save className="h-4 w-4" /> {pick("حفظ التغييرات", "Save Changes")}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
