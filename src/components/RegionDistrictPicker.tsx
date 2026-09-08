import { useEffect, useState } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { listDistricts, listRegions, type DistrictOption, type RegionOption } from '../api/referenceService'
import { useLocale, useT } from '../context/LocaleContext'

/**
 * Region-then-district select pair, shared by the registration screen
 * and the profile edit screen -- both optional (empty string = unset,
 * which the backend already treats as "not provided", see
 * parseOptionalUUID). Picking a region resets the district: the
 * previously-picked district almost certainly doesn't belong to the
 * newly-picked region, and the aggregate has no way to cross-validate
 * the pair itself (see identity.User.SetDistrict's doc comment).
 */
export function RegionDistrictPicker({
  regionId,
  districtId,
  onChange,
}: {
  regionId: string
  districtId: string
  onChange: (regionId: string, districtId: string) => void
}) {
  const { lang } = useLocale()
  const t = useT()
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [districts, setDistricts] = useState<DistrictOption[]>([])

  useEffect(() => {
    void listRegions(lang).then(setRegions).catch(() => setRegions([]))
  }, [lang])

  useEffect(() => {
    if (!regionId) {
      // Deferred a tick: setDistricts([]) would otherwise run
      // synchronously within the effect body itself.
      queueMicrotask(() => setDistricts([]))
      return
    }
    let cancelled = false
    void listDistricts(regionId, lang).then((d) => { if (!cancelled) setDistricts(d) }).catch(() => { if (!cancelled) setDistricts([]) })
    return () => { cancelled = true }
  }, [regionId, lang])

  return (
    <>
      <div className="mt-4">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('field.region')}</label>
        <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3.5 border border-border shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          <MapPin size={17} className="text-muted-foreground shrink-0" />
          <select
            value={regionId}
            onChange={(e) => onChange(e.target.value, '')}
            className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none"
          >
            <option value="">{t('field.selectRegion')}</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('field.district')}</label>
        <div className={`mt-2 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3.5 border border-border shadow-card transition-all ${regionId ? 'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15' : 'opacity-50'}`}>
          <Building2 size={17} className="text-muted-foreground shrink-0" />
          <select
            value={districtId}
            onChange={(e) => onChange(regionId, e.target.value)}
            disabled={!regionId}
            className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none"
          >
            <option value="">{t('field.selectDistrict')}</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
    </>
  )
}
