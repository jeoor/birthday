import { AnimatePresence, MotionConfig } from 'motion/react'
import { useState } from 'react'
import { BirthdayExperience } from './components/BirthdayExperience'
import { FontLoadingScreen } from './components/FontLoadingScreen'
import { OrdinaryCountdownHero } from './components/OrdinaryCountdownHero'
import { SimulationBanner } from './components/SimulationBanner'
import { YearProgress } from './components/YearProgress'
import { useBirthday } from './hooks/useBirthday'
import { useFontsReady } from './hooks/useFontsReady'
import { useInitialMotionSettled } from './hooks/useInitialMotionSettled'
import { birthdayStorageKey } from './lib/birthday'
import { UI_TRANSITION } from './lib/motion'
import { readBoolean } from './lib/utils'

export default function App() {
  const birthday = useBirthday()
  const fontsReady = useFontsReady()
  const initialMotionSettled = useInitialMotionSettled()
  const pageReady = fontsReady && initialMotionSettled
  const storageKey = birthdayStorageKey(birthday.now)
  const [celebrationStarted, setCelebrationStarted] = useState(
    () => birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`),
  )
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey)

  // 日期键变化（跨天/模拟日期切换）时，在渲染期间重置庆典状态——
  // React 官方推荐用"渲染期状态调整"替代 effect 内同步 setState。
  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey)
    setCelebrationStarted(birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`))
  }

  return (
    <MotionConfig transition={UI_TRANSITION}>
      <AnimatePresence>{!pageReady && <FontLoadingScreen key="font-loading" />}</AnimatePresence>
      <div
        className={birthday.isBirthday ? 'app-shell birthday-mode' : 'app-shell ordinary-mode'}
        data-benming={birthday.benmingYear.isBenmingYear ? 'active' : 'inactive'}
        // 字体就绪前隐藏内容（visibility:hidden 仍会触发浏览器按需下载字形切片，
        // 因此页面用到的全部字符会自动进入加载队列；显形时字体已齐，无交换跳变）。
        style={pageReady ? undefined : { visibility: 'hidden' }}
      >
        {birthday.isSimulated && birthday.simulatedDate && <SimulationBanner date={birthday.simulatedDate} />}
        <main className="page-content">
          {birthday.isBirthday ? (
            <BirthdayExperience
              key={storageKey}
              age={birthday.age}
              celebrationStarted={celebrationStarted}
              onCelebrationChange={setCelebrationStarted}
              storageKey={storageKey}
              benmingYear={birthday.benmingYear}
            />
          ) : (
            <>
              <OrdinaryCountdownHero
                age={birthday.age}
                target={birthday.nextBirthday}
                simulatedNow={birthday.isSimulated ? birthday.now : undefined}
                benmingYear={birthday.benmingYear}
              />
              <YearProgress
                age={birthday.age}
                progress={birthday.ageProgress}
                isBenmingYear={birthday.benmingYear.isBenmingYear}
                active={fontsReady}
              />
            </>
          )}
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  )
}

/** 页脚：© 年份 · 署名（链接）· MIT License。 */
function SiteFooter() {
  return (
    <footer className="app-footer">
      © {new Date().getFullYear()}{' '}
      <a href="https://www.kayro.cn" target="_blank" rel="noreferrer">
        敖苛
      </a>
      {' · MIT License'}
    </footer>
  )
}
