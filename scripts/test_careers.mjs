import { careersRepo } from "../src/lib/data/careers.js";
import fs from "fs";

async function runTests() {
  console.log("=================================================");
  console.log("       ERAS STUDIO — CAREERS AUTOMATED TEST SUITE ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. Admin Create Opportunity as Draft
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Opportunity Lifecycle (Draft, Publish, Close) ---");
  const draftOpp = await careersRepo.create({
    title: "Test Exhibition Designer",
    department: "Design & Typography",
    employmentType: "Full-time",
    location: "Berlin, Germany",
    workMode: "Hybrid",
    description: "Designing virtual spatial gallery installations.",
    responsibilities: "Spatial 3D models and lighting design.",
    requirements: "3+ years 3D architectural or exhibition experience.",
    experience: "3+ years",
    applicationDeadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    openings: 1,
    status: "draft",
  });

  assert(draftOpp && draftOpp.id, "Opportunity created with ID: " + draftOpp?.id);
  assert(draftOpp.status === "draft", "Opportunity initially saved as 'draft'");

  // -----------------------------------------------------------------
  // 2. Draft opportunities hidden from public
  // -----------------------------------------------------------------
  const publicListBefore = await careersRepo.list({ status: "published" });
  const draftInPublic = publicListBefore.some((o) => o.id === draftOpp.id);
  assert(!draftInPublic, "Draft opportunity is NOT visible on public careers list");

  // -----------------------------------------------------------------
  // 3. Admin Publishes Opportunity
  // -----------------------------------------------------------------
  const publishedOpp = await careersRepo.update(draftOpp.id, { status: "published" });
  assert(publishedOpp && publishedOpp.status === "published", "Admin updated opportunity status to 'published'");

  const publicListAfter = await careersRepo.list({ status: "published" });
  const publishedInPublic = publicListAfter.some((o) => o.id === draftOpp.id);
  assert(publishedInPublic, "Published opportunity IS now visible on public careers list");

  // -----------------------------------------------------------------
  // 4. Admin Edits Opportunity
  // -----------------------------------------------------------------
  const editedOpp = await careersRepo.update(draftOpp.id, {
    title: "Senior Exhibition & Spatial Designer",
    openings: 3,
  });
  assert(
    editedOpp?.title === "Senior Exhibition & Spatial Designer" && editedOpp.openings === 3,
    "Opportunity title and openings updated successfully"
  );

  // -----------------------------------------------------------------
  // 5. Candidate Application Submission
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Candidate Applications & Tracking ---");
  const candidateEmail = `test.candidate.${Date.now()}@example.com`;
  const app = await careersRepo.createApplication({
    opportunityId: draftOpp.id,
    candidateName: "Elena Rostova",
    email: candidateEmail,
    phone: "+49 30 12345678",
    resumeUrl: "https://uswuqczfbypzefndsifu.supabase.co/storage/v1/object/public/career-resumes/elena_cv.pdf",
    portfolioUrl: "https://elenarostova-design.com",
    linkedinUrl: "https://linkedin.com/in/elenarostova",
    coverLetter: "I have spent five years crafting virtual spatial experiences for independent biennials...",
    status: "Applied",
  });

  assert(app && app.id, "Candidate application submitted with ID: " + app?.id);
  assert(app.status === "Applied", "Initial application status is 'Applied'");
  assert(app.adminNotes === null, "Initial application has null internal notes");

  // -----------------------------------------------------------------
  // 6. Application Count Updated on Opportunity
  // -----------------------------------------------------------------
  const reloadedOpp = await careersRepo.getById(draftOpp.id);
  assert(
    reloadedOpp && reloadedOpp.applicationCount && reloadedOpp.applicationCount >= 1,
    `Opportunity applicationCount reflects new application (Count = ${reloadedOpp?.applicationCount})`
  );

  // -----------------------------------------------------------------
  // 7. Admin Updates Application Status & Adds Admin Notes
  // -----------------------------------------------------------------
  const reviewedApp = await careersRepo.updateApplication(app.id, {
    status: "Under Review",
    adminNotes: "Exceptional spatial design portfolio. Advancing to curator interview.",
  });
  assert(reviewedApp?.status === "Under Review", "Application status transitioned to 'Under Review'");
  assert(
    reviewedApp?.adminNotes === "Exceptional spatial design portfolio. Advancing to curator interview.",
    "Internal admin note persisted successfully"
  );

  // Status transitions: Shortlisted -> Interview
  const interviewApp = await careersRepo.updateApplication(app.id, { status: "Interview" });
  assert(interviewApp?.status === "Interview", "Application status transitioned to 'Interview'");

  // -----------------------------------------------------------------
  // 8. Admin Closes Opportunity
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Opportunity Closing & Deletion ---");
  const closedOpp = await careersRepo.update(draftOpp.id, { status: "closed" });
  assert(closedOpp?.status === "closed", "Admin marked opportunity as 'closed'");

  const publicListClosed = await careersRepo.list({ status: "published" });
  const closedInPublic = publicListClosed.some((o) => o.id === draftOpp.id);
  assert(!closedInPublic, "Closed opportunity is hidden from public list");

  // -----------------------------------------------------------------
  // 9. Admin Cleans Up Test Data (Delete cascading)
  // -----------------------------------------------------------------
  const oppDeleted = await careersRepo.delete(draftOpp.id);
  assert(oppDeleted, "Opportunity deleted successfully");

  const appStillExists = await careersRepo.getApplicationById(app.id);
  assert(!appStillExists, "Associated applications cascade deleted with opportunity");

  // -----------------------------------------------------------------
  // 10. Verification of Migration Schema & Strict Constraints
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Database & CSS Constraints Verification ---");
  const migrationPath = "supabase/migrations/20261030_careers_management.sql";
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  assert(
    migrationContent.includes("CREATE TABLE IF NOT EXISTS public.career_opportunities") &&
      migrationContent.includes("CREATE TABLE IF NOT EXISTS public.career_applications"),
    "Migration file defines exactly Table 1: career_opportunities and Table 2: career_applications"
  );

  // Check that no 3rd table is created
  const tableMatches = migrationContent.match(/CREATE TABLE/gi);
  assert(
    tableMatches && tableMatches.length === 2,
    `Strict constraint: EXACTLY two tables created (Found ${tableMatches?.length} tables in migration)`
  );

  assert(
    migrationContent.includes("ENABLE ROW LEVEL SECURITY") &&
      migrationContent.includes("status = 'published'"),
    "Row Level Security policies properly configured for public vs admin access"
  );

  // Check no new CSS files created in src
  const srcFiles = fs.readdirSync("src", { recursive: true });
  const cssFiles = srcFiles.filter((f) => typeof f === "string" && f.endsWith(".css"));
  assert(
    cssFiles.length === 1 && cssFiles[0].includes("globals.css"),
    `Strict constraint: No new CSS files created. Only existing globals.css exists (${cssFiles.join(", ")})`
  );

  console.log("=================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

