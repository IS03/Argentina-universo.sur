// Institutional identity authorized by the owner. A display-name change does not change identity.
export const INSTITUTIONAL_PROJECT_REF = 'vpbonlzixodxvbybkffv';
export const INSTITUTIONAL_ORGANIZATION_ID = 'mzfanqzfjskgapsulpip';
export const INSTITUTIONAL_URL = `https://${INSTITUTIONAL_PROJECT_REF}.supabase.co`;
export const INSTITUTIONAL_REGION = 'us-east-1';
export function assertInstitutionalIdentity(project: { id?: string; ref?: string; organization_id?: string; region?: string; status?: string }) {
  if (project.id !== INSTITUTIONAL_PROJECT_REF || project.ref && project.ref !== INSTITUTIONAL_PROJECT_REF ||
      project.organization_id !== INSTITUTIONAL_ORGANIZATION_ID || project.region !== INSTITUTIONAL_REGION ||
      project.status !== 'ACTIVE_HEALTHY') throw Error('INSTITUTIONAL_PROJECT_MISMATCH');
}
