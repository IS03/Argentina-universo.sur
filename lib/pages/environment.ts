type Environment = Record<string, string | undefined>;
export function isPagesPreview(env: Environment): boolean {
  return (
    env.VERCEL_ENV === "preview" ||
    (env.AUS_STATIC_EXPORT === "1" &&
      (env.SITE_ENV !== "production" ||
        env.CF_PAGES_BRANCH !== env.SITE_PRODUCTION_BRANCH ||
        !env.SITE_PRODUCTION_BRANCH))
  );
}
export function pagesAnalyticsAllowed(env: Environment): boolean {
  return (
    env.AUS_STATIC_EXPORT === "1" &&
    !isPagesPreview(env) &&
    env.CF_PAGES === "1"
  );
}
