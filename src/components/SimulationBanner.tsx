import { FlaskConical, X } from 'lucide-react'

interface SimulationBannerProps {
  date: string
}

export function SimulationBanner({ date }: SimulationBannerProps) {
  const clearSimulation = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('date')
    window.history.replaceState(null, '', url.toString())
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="simulation-banner" role="status">
      <FlaskConical size={12} aria-hidden="true" />
      <span className="simulation-copy simulation-copy-desktop">
        开发预览 · <time dateTime={date}>{date}</time> · 发布后忽略
      </span>
      <span className="simulation-copy simulation-copy-mobile">
        预览 · <time dateTime={date}>{date}</time>
      </span>
      <button type="button" onClick={clearSimulation} aria-label="退出日期模拟"><X size={13} /></button>
    </div>
  )
}
