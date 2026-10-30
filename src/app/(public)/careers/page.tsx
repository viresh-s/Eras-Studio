import React from "react";
import { careersRepo } from "@/lib/data/careers";
import { CareersPublicClient } from "./CareersPublicClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — Build Your Future With Us | Eras Studio",
  description:
    "Join our mission to connect independent creators with passionate art patrons worldwide. Explore open career opportunities at Eras Studio.",
};

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  // Fetch ONLY published opportunities from database
  const publishedOpportunities = await careersRepo.list({
    status: "published",
  });

  // Strip any internal or non-public fields before sending to client
  const sanitizedOpportunities = publishedOpportunities.map((opp) => ({
    ...opp,
    applicationCount: undefined,
  }));

  return <CareersPublicClient initialOpportunities={sanitizedOpportunities} />;
}

