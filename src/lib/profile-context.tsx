"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";

interface UserProfile {
  id: string;
  displayName: string;
  fullName: string;
  country: string;
  educationLevel: string;
  gpa: number;
  englishLevel: string;
  targetDegree: string;
  major: string;
  budget: number;
  hasResearch: boolean;
  hasWorkExperience: boolean;
  dateOfBirth: string;
  email: string;
}

type ProfileState = {
  profile: UserProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      const json = await res.json();
      if (json.success) setProfile(json.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refresh: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
