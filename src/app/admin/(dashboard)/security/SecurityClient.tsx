"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  SecurityIcon,
  VerifiedCheckIcon,
  UsersIcon,
} from "@/components/admin/icons";
import { SecurityCentreData, getAdminSecurityOverviewAction } from "@/app/admin/security-actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui";

interface SecurityClientProps {
  initialData: SecurityCentreData;
}

type TabType = "admins" | "audit";

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoStr;
  }
}

export function SecurityClient({ initialData }: SecurityClientProps) {
  const toast = useToast();
  const [data, setData] = useState<SecurityCentreData>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>("admins");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminSecurityOverviewAction();
      if (res.success && res.data) {
        setData(res.data);
        toast.success("Security Centre updated with live telemetry.");
      } else {
        toast.error(res.error || "Failed to refresh telemetry.");
      }
    } catch {
      toast.error("Failed to refresh security metrics.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-normal text-[#141413] tracking-tight"
            style={{
              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Security Centre.
          </h1>
          <p className="text-xs sm:text-sm text-[#71716D] mt-1 font-normal">
            Real-time security telemetry, access controls, database RLS, and admin accountability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="rounded-full bg-white border-[#E8E8E3] text-[#141413] hover:bg-[#F7F7F5] text-xs"
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Authorised Admins & Audit Log) */}
      <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeTab === "admins"
              ? "bg-[#141413] text-white"
              : "text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EF]"
          }`}
        >
          <UsersIcon size={14} className="stroke-[1.75]" />
          <span>Admin Access ({data.adminAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#141413] text-white"
              : "text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EF]"
          }`}
        >
          <SecurityIcon size={14} className="stroke-[1.75]" />
          <span>Audit Log Stream ({data.recentEvents.length})</span>
        </button>
      </div>

      {/* SECTION 1: AUTHORISED ADMINISTRATORS */}
      {activeTab === "admins" && (
        <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#E8E8E3]">
            <h3 className="text-sm font-semibold text-[#141413]">Authorised Administrators</h3>
            <p className="text-xs text-[#71716D] mt-0.5">
              Identities permitted to access studio administration, moderation, and executive operations.
            </p>
          </div>

          <div className="divide-y divide-[#E8E8E3]">
            {data.adminAccounts.map((admin) => (
              <div key={admin.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#141413]">{admin.name}</span>
                    <Badge variant="default" size="sm">{admin.role}</Badge>
                  </div>
                  <p className="text-xs text-[#71716D]">{admin.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1.5">
                    <VerifiedCheckIcon size={13} className="text-emerald-600" />
                    MFA Active
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 font-medium border border-gray-200 capitalize">
                    {admin.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: AUDIT LOG STREAM */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">Recent Security Audit Events</h3>
              <p className="text-xs text-[#71716D] mt-0.5">
                Redacted, immutable audit trail of system operations and security actions.
              </p>
            </div>
            <span className="text-xs text-[#71716D]">{data.recentEvents.length} events logged</span>
          </div>

          {data.recentEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71716D]">
              No security anomalies or warning events recorded in the current session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-[#71716D] font-medium border-b border-[#E8E8E3]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor ID</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {data.recentEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#FAF9F5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#71716D] whitespace-nowrap">
                        {formatTimestamp(evt.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            evt.level === "SECURITY_ALERT" || evt.level === "ERROR"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : evt.level === "SECURITY_AUDIT" || evt.level === "WARN"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {evt.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#141413]">{evt.action}</td>
                      <td className="py-3 px-4 text-[#71716D] font-mono text-[11px] truncate max-w-[140px]">
                        {evt.userId}
                      </td>
                      <td className="py-3 px-4 text-[#71716D] font-mono text-[11px]">{evt.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
