import request from './request'

/**
 * Region/district lookups for the optional "where are you from" field on
 * registration and profile edit. Public on the backend (no auth) since
 * the registration screen needs these before there's a token -- this
 * client doesn't need to do anything special for that, the request
 * interceptor just won't find a token to attach.
 *
 *   GET /regions                    → RegionOption[]
 *   GET /regions/{regionId}/districts → DistrictOption[]
 */
export interface RegionOption {
  id: string
  code: string
  name: string
}

export interface DistrictOption {
  id: string
  region_id: string
  code: string
  name: string
}

export async function listRegions(lang: string): Promise<RegionOption[]> {
  return request.get('/api/v1/regions', { params: { lang } })
}

export async function listDistricts(regionId: string, lang: string): Promise<DistrictOption[]> {
  return request.get(`/api/v1/regions/${regionId}/districts`, { params: { lang } })
}
