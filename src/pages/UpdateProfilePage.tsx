import { useRef, useState } from 'react'
import { Camera, Loader2, UserCircle } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { SmoothImage } from '../components/SmoothImage'
import { useAuth } from '../context/AuthContext'
import { useT } from '../context/LocaleContext'

export function UpdateProfilePage({ onDone }: { onDone: () => void }) {
  const { profile, updateFullName, uploadAvatar, isSubmitting, authError, clearAuthError } = useAuth()
  const t = useT()
  const [name, setName] = useState(profile?.fullName ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      await uploadAvatar(file)
    } catch {
      setUploadError(t('auth.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    try {
      await updateFullName(name.trim())
      onDone()
    } catch { /* surfaced via authError */ }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title={t('profile.editInfo')} onBack={onDone} />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex flex-col items-center gap-2 py-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="press relative w-24 h-24"
          >
            <span className="absolute inset-0 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
              {profile?.avatarUrl ? (
                <SmoothImage src={profile.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={44} className="text-primary/50" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                  <Loader2 size={22} className="text-white animate-spin" />
                </div>
              )}
            </span>
            {!uploading && (
              <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-brand">
                <Camera size={14} className="text-primary-foreground" />
              </span>
            )}
          </button>
          <p className={`text-[12px] ${uploadError ? 'text-destructive' : 'text-muted-foreground'}`}>
            {uploading ? t('auth.uploading') : uploadError || t('auth.uploadPhoto')}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="mt-6">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('field.fullName')}</label>
          <input
            type="text"
            placeholder={t('field.fullNamePlaceholder')}
            value={name}
            onChange={(e) => { setName(e.target.value); if (authError) clearAuthError() }}
            className="mt-2 w-full px-4 py-3.5 bg-card rounded-2xl text-[15px] font-medium text-foreground border border-border shadow-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60 placeholder:font-normal"
          />
        </div>

        {authError && <p className="text-[12px] text-destructive mt-3 ml-1">{authError}</p>}
      </div>

      <div className="px-6 pt-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
        <button
          onClick={handleSave}
          disabled={!name.trim() || isSubmitting}
          className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}
