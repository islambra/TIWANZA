import { Download, FileText, PlayCircle } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { Button } from './ui.jsx'

export function LessonBlock({ block }) {
  const { t } = useI18n()
  const downloadUrl = block.data?.url || block.data?.dataUrl
  const downloadName = block.data?.fileName || block.data?.title || 'download'
  if (block.type === 'richtext') return <div className="lesson-content text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: block.data?.html || '' }} />
  if (block.type === 'video') return <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-line"><div className="relative grid aspect-video place-items-center bg-ink text-white"><div className="min-w-0 max-w-full px-4 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15"><PlayCircle size={28} /></span><p className="mt-2 break-words text-sm font-semibold">{block.data?.fileName || t('learner.watchVideo')}</p><p className="mt-1 text-[10px] text-white/60">{t('common.simulated')}</p></div></div></div>
  if (block.type === 'youtube') { const id = block.data?.url?.match(/(?:v=|youtu\.be\/)([\w-]{6,})/)?.[1]; return id ? <div className="overflow-hidden rounded-xl border border-line"><iframe title={block.data?.title || 'YouTube'} src={`https://www.youtube.com/embed/${id}`} className="aspect-video w-full" allowFullScreen /></div> : null }
  if (block.type === 'image') return <figure><img src={block.data?.url} alt={block.data?.caption || ''} className="w-full rounded-xl border border-line" />{block.data?.caption ? <figcaption className="mt-1.5 text-center text-[10px] text-muted">{block.data.caption}</figcaption> : null}</figure>
  if (block.type === 'pdf' || block.type === 'file' || block.type === 'gdrive') return <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand"><FileText size={18} /></span><div className="min-w-0 flex-1 basis-0"><p className="truncate text-xs font-semibold text-ink">{downloadName}</p><p className="break-words text-[10px] text-muted">{block.data?.sizeMb ? `${block.data.sizeMb} Mo` : ''} · {t('common.simulated')}</p></div><Button variant="soft" size="sm" icon={Download} className="max-w-full" disabled={!downloadUrl} onClick={() => { const link = document.createElement('a'); link.href = downloadUrl; link.download = downloadName; link.click() }}>{t('learner.downloadFile')}</Button></div>
  return null
}
