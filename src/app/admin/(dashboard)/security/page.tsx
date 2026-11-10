import React from "react";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/auth";
import { getAdminSecurityOverviewAction } from "@/app/admin/security-actions";
import { SecurityClient } from "./SecurityClient";

export const metadata: Metadata = {
  title: "Security Centre | ErasStudio® Admin",
  description: "Monitor real-time security events, access controls, database RLS, and admin audit accountability.",
};

export default async function SecurityCentrePage() {
  await requireAdminSession();

  const res = await getAdminSecurityOverviewAction();
  const initialData = res.data || {
    stats: {
      totalEventsCount: 0,
      failedAuthCount: 0,
      unauthorizedApiCount: 0,
      securityAlertsCount: 0,
    },
    securityControls: [],
    adminAccounts: [],
    recentEvents: [],
  };

  return <SecurityClient initialData={initialData} />;
}

