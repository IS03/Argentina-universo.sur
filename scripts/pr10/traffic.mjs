// Planning assumptions, not a bill or measured Cloudflare limits enforcement.
export function estimateTraffic(
  visits,
  {
    pageViewsPerVisit = 3,
    requestsPerPage = 25,
    bytesPerPage = 800000,
    dynamicRequestsPerPage = 2,
    peakFactor = 10,
    pdfDownloadRate = 0,
    pdfBytes = 633579423 / 24,
  } = {},
) {
  for (const value of [
    visits,
    pageViewsPerVisit,
    requestsPerPage,
    bytesPerPage,
    dynamicRequestsPerPage,
    peakFactor,
    pdfDownloadRate,
    pdfBytes,
  ])
    if (!Number.isFinite(value) || value < 0)
      throw Error("Non-negative finite assumptions required");
  if (dynamicRequestsPerPage > requestsPerPage || pdfDownloadRate > 1)
    throw Error("Inconsistent traffic assumptions");
  const pageViews = visits * pageViewsPerVisit,
    requests = pageViews * requestsPerPage,
    dynamic = pageViews * dynamicRequestsPerPage;
  const totalBytes =
    pageViews * bytesPerPage + visits * pdfDownloadRate * pdfBytes;
  return {
    visits,
    pageViews,
    staticArchitecture: { staticRequests: requests, dynamicRequests: 0 },
    workersArchitecture: {
      staticRequests: requests - dynamic,
      dynamicRequests: dynamic,
      averageDynamicPerDay: dynamic / 30,
      peakDynamicPerDay: Math.ceil((dynamic / 30) * peakFactor),
      dailyRequestLimitExceeded:
        Math.ceil((dynamic / 30) * peakFactor) > 100000,
      cpuAndMemoryFit: "UNVERIFIED",
    },
    totalBytes,
    decimalGB: totalBytes / 1e9,
    assumptions: {
      pageViewsPerVisit,
      requestsPerPage,
      bytesPerPage,
      dynamicRequestsPerPage,
      peakFactor,
      pdfDownloadRate,
      pdfBytes,
    },
  };
}
