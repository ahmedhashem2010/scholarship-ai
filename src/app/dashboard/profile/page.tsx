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
import { Loader2, Save, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
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
      addToast("error", "Failed to load profile")
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
        addToast("success", "Profile updated successfully!")
        router.push("/dashboard")
      } else {
        throw new Error(result.error || "Failed to update")
      }
    } catch {
      addToast("error", "Failed to update profile")
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
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal details and academic information
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and academic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={profile.country} onValueChange={(value: string) => handleChange("country", value)}>
                <SelectItem value="Egypt">Egypt</SelectItem>
                <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                <SelectItem value="UAE">UAE</SelectItem>
                <SelectItem value="Jordan">Jordan</SelectItem>
                <SelectItem value="Lebanon">Lebanon</SelectItem>
                <SelectItem value="Iraq">Iraq</SelectItem>
                <SelectItem value="Syria">Syria</SelectItem>
                <SelectItem value="Yemen">Yemen</SelectItem>
                <SelectItem value="Oman">Oman</SelectItem>
                <SelectItem value="Qatar">Qatar</SelectItem>
                <SelectItem value="Bahrain">Bahrain</SelectItem>
                <SelectItem value="Kuwait">Kuwait</SelectItem>
                <SelectItem value="Palestine">Palestine</SelectItem>
                <SelectItem value="Algeria">Algeria</SelectItem>
                <SelectItem value="Morocco">Morocco</SelectItem>
                <SelectItem value="Tunisia">Tunisia</SelectItem>
                <SelectItem value="Libya">Libya</SelectItem>
                <SelectItem value="Sudan">Sudan</SelectItem>
                <SelectItem value="Mauritania">Mauritania</SelectItem>
                <SelectItem value="Somalia">Somalia</SelectItem>
                <SelectItem value="Djibouti">Djibouti</SelectItem>
                <SelectItem value="Comoros">Comoros</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationLevel">Current Education</Label>
              <Select value={profile.educationLevel} onValueChange={(value: string) => handleChange("educationLevel", value)}>
                <SelectItem value="high-school">High School</SelectItem>
                <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                <SelectItem value="master">Master&apos;s Degree</SelectItem>
                <SelectItem value="phd">PhD / Doctorate</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Field of Study</Label>
              <Select value={profile.major} onValueChange={(value: string) => handleChange("major", value)}>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Medicine">Medicine</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Law">Law</SelectItem>
                <SelectItem value="Economics">Economics</SelectItem>
                <SelectItem value="Arts & Humanities">Arts &amp; Humanities</SelectItem>
                <SelectItem value="Natural Sciences">Natural Sciences</SelectItem>
                <SelectItem value="Social Sciences">Social Sciences</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Architecture">Architecture</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Dentistry">Dentistry</SelectItem>
                <SelectItem value="Nursing">Nursing</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDegree">Target Degree</Label>
              <Select value={profile.targetDegree} onValueChange={(value: string) => handleChange("targetDegree", value)}>
                <SelectItem value="bachelor">Bachelor&apos;s</SelectItem>
                <SelectItem value="master">Master&apos;s</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="exchange">Exchange Program</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpa">GPA</Label>
              <Input id="gpa" type="number" step="0.01" value={profile.gpa} onChange={(e) => handleChange("gpa", e.target.value)} placeholder="e.g., 3.5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="englishLevel">English Level</Label>
              <Select value={profile.englishLevel} onValueChange={(value: string) => handleChange("englishLevel", value)}>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="fluent">Fluent</SelectItem>
                <SelectItem value="native">Native</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="IELTS">IELTS</SelectItem>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
