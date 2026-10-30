import React from "react";
import { requireAdminSession } from "@/lib/auth";
import { careersRepo } from "@/lib/data/careers";
import { CareersClient } from "./CareersClient";

export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  await requireAdminSession("careers:view");

  const [stats, opportunities, applications] = await Promise.all([
    careersRepo.stats(),
    careersRepo.list(),
    careersRepo.listApplications(),
  ]);

  return (
    <div className="space-y-8">
      <CareersClient
        initialStats={stats}
        initialOpportunities={opportunities}
        initialApplications={applications}
      />
    </div>
  );
}

