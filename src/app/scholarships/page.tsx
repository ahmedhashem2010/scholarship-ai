'use client';

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import { ScholarshipCardList } from "@/components/scholarship-card-list";
import { Header } from "@/components/scholarship/header";

export default async function ScholarshipsPage() {
  const scholarships = await prisma.scholarship.findMany({ orderBy: { deadline: "asc" } });

  return (
    <>
      <Header />
      <div className="page-container py-8 space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-white/80" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Scholarship Database</span>
            </div>
            <h1 className="text-h2 sm:text-h1 mt-2">Browse Scholarships</h1>
            <p className="mt-2 text-white/80 max-w-2xl">
              Discover {scholarships.length} fully-funded scholarships for Arab and Egyptian students
            </p>
          </div>
        </div>

        <ScholarshipCardList scholarships={scholarships} />
      </div>
    </>
  );
}
