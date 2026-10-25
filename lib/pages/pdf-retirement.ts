import { tripContentHash, tripPublishable, validateTrip, type Trip } from "./trips.ts";

export type PdfReplacement = {
  legacyGuideId: string;
  pdf: { path: string; bytes: number; sha256: string };
  proposedHtml: string;
  replacement: {
    scopeReview: { equivalent: boolean; reviewer: string; date: string; pdfSha256: string; tripContentSha256: string } | null;
    backup: { access: "private"; outsidePublicDeployments: boolean; sha256: string; bytes: number; verifiedBy: string; verifiedAt: string; restorationVerified: boolean } | null;
    retirementApproval: { reviewer: string; date: string; pdfSha256: string; tripContentSha256: string } | null;
  };
};
function dateValid(value: string | undefined): boolean {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

// Proposal only. This module has no I/O and can neither remove a PDF nor activate a redirect.
export function planPdfRetirement(row: PdfReplacement, trip?: Trip) {
  const blockers: string[] = [];
  const hash = trip ? tripContentHash(trip) : null;
  if (!/^\/pdf\/[^?#]+\.pdf$/.test(row.pdf.path) || row.pdf.path.includes("..") || !/^[a-f0-9]{64}$/.test(row.pdf.sha256) || row.pdf.bytes <= 0) blockers.push("invalid-source-identity");
  if (!trip || !tripPublishable(trip) || validateTrip(trip).length) blockers.push("html-not-approved-and-publishable");
  if (!trip || row.proposedHtml !== "/escapadas/" + trip.slug || trip.schemaVersion !== 2 || !trip.editorial.origin.legacyGuideIds.includes(row.legacyGuideId)) blockers.push("target-or-legacy-relation-not-verified");
  const scope = row.replacement.scopeReview;
  if (!scope?.equivalent || !scope.reviewer || !dateValid(scope.date) || scope.pdfSha256 !== row.pdf.sha256 || scope.tripContentSha256 !== hash) blockers.push("equivalence-review-missing-or-stale");
  const backup = row.replacement.backup;
  if (!backup || backup.access !== "private" || !backup.outsidePublicDeployments || !backup.restorationVerified || !backup.verifiedBy || !dateValid(backup.verifiedAt) || backup.sha256 !== row.pdf.sha256 || backup.bytes !== row.pdf.bytes) blockers.push("independent-restorable-backup-not-verified");
  const approval = row.replacement.retirementApproval;
  if (!approval?.reviewer || !dateValid(approval.date) || approval.pdfSha256 !== row.pdf.sha256 || approval.tripContentSha256 !== hash) blockers.push("retirement-not-approved-or-stale");
  return {
    legacyGuideId: row.legacyGuideId,
    blockers,
    proposedRedirect: blockers.length ? null : { source: row.pdf.path, destination: row.proposedHtml, status: 308 as const },
    publicWrites: 0 as const,
  };
}
