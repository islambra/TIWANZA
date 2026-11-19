import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight, GraduationCap, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, IconButton } from './ui.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { cn } from '../lib/utils.js'

export default function PublicLayout() {
  const { t } = useI18n()
  const { isAuthenticated, home } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const links = [
    { href: '/#features', label: t('landing.footerFeatures') },
    { href: '/#how', label: t('landing.howItWorksTitle') },
    { href: '/#plans', label: t('landing.footerPricing') },
    { href: '/#faq', label: t('landing.faqTitle') },
  ]

  return (
    <div className="flex min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-clip bg-white">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm">
              <GraduationCap size={19} />
            </span>
            <span className="min-w-0">
              <span className="brand-font block truncate text-sm font-bold leading-none tracking-tight text-ink sm:text-lg">Tiwanza</span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:block">LMS Algérie</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher variant="outline" className="px-2 sm:px-2.5" />
            {isAuthenticated ? (
              <>
                <Button
                  size="xs"
                  onClick={() => { window.location.href = home }}
                  className="public-dashboard-button max-w-[96px]"
                >
                  {t('common.dashboard')}
                </Button>
                <Button size="sm" onClick={() => { window.location.href = home }} className="public-dashboard-desktop">
                  {t('common.dashboard')}
                  <ArrowRight size={15} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface sm:block">
                  {t('landing.trainerLogin')}
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button size="sm">{t('landing.trainerSignup')}</Button>
                </Link>
              </>
            )}
            <IconButton label={t('landing.menu')} onClick={() => setMenuOpen((v) => !v)} className="md:hidden">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </IconButton>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-line bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink">
                  {link.label}
                </a>
              ))}
              <div className="mt-2 grid gap-2">
                <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
                  <Link to="/login"><Button variant="secondary" fullWidth size="sm">{t('landing.trainerLogin')}</Button></Link>
                  <Link to="/register"><Button fullWidth size="sm">{t('landing.trainerSignup')}</Button></Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg text-white">
                  <GraduationCap size={17} />
                </span>
                <span className="brand-font text-lg font-bold text-ink">Tiwanza</span>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">{t('landing.footerAbout')}</p>
              <p className="mt-3 text-[11px] font-medium text-brand">{t('app.madeIn')}</p>
            </div>
            <FooterColumn title={t('landing.footerProduct')}>
              <a href="#features">{t('landing.footerFeatures')}</a>
              <a href="#plans">{t('landing.footerPricing')}</a>
            </FooterColumn>
            <FooterColumn title={t('landing.footerCompany')}>
              <a href="#testimonials">{t('landing.footerAboutLink')}</a>
              <a href="mailto:contact@tiwanza.dz">{t('landing.footerContact')}</a>
            </FooterColumn>
            <FooterColumn title={t('landing.footerLegal')}>
              <a href="#terms">{t('landing.footerTerms')}</a>
              <a href="#privacy">{t('landing.footerPrivacy')}</a>
              <span className="inline-flex items-center gap-1.5">{t('app.demoBadge')}</span>
            </FooterColumn>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row">
            <p>{t('landing.footerRights', { year: new Date().getFullYear() })}</p>
            <p>{t('app.version')} · {t('common.simulated')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">{title}</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-muted [&>a:hover]:text-brand [&>a]:transition [&>a]:w-fit">
        {children}
      </div>
    </div>
  )
}
