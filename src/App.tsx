import { AnimatePresence, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { BirthdayExperience } from './components/BirthdayExperience'
import { FontLoadingScreen } from './components/FontLoadingScreen'
import { OrdinaryCountdownHero } from './components/OrdinaryCountdownHero'
import { SimulationBanner } from './components/SimulationBanner'
import { YearProgress } from './components/YearProgress'
import { useBirthday } from './hooks/useBirthday'
import { useFontsReady } from './hooks/useFontsReady'
import { birthdayStorageKey } from './lib/birthday'
import { UI_TRANSITION } from './lib/motion'
import { readBoolean } from './lib/utils'

export default function App() {
  const birthday = useBirthday()
  const fontsReady = useFontsReady()
  const storageKey = birthdayStorageKey(birthday.now)
  const [celebrationStarted, setCelebrationStarted] = useState(
    () => birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`),
  )

  useEffect(() => {
    setCelebrationStarted(birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`))
  }, [birthday.isBirthday, storageKey])

  return (
    <MotionConfig transition={UI_TRANSITION}>
      <AnimatePresence>{!fontsReady && <FontLoadingScreen key="font-loading" />}</AnimatePresence>
      <div
        className={birthday.isBirthday ? 'app-shell birthday-mode' : 'app-shell ordinary-mode'}
        data-benming={birthday.benmingYear.isBenmingYear ? 'active' : 'inactive'}
        // 字体就绪前隐藏内容（visibility:hidden 仍会触发浏览器按需下载字形切片，
        // 因此页面用到的全部字符会自动进入加载队列；显形时字体已齐，无交换跳变）。
        style={fontsReady ? undefined : { visibility: 'hidden' }}
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
      </div>
    </MotionConfig>
  )
}
