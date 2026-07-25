import { MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { BirthdayExperience } from './components/BirthdayExperience'
import { OrdinaryCountdownHero } from './components/OrdinaryCountdownHero'
import { SimulationBanner } from './components/SimulationBanner'
import { YearProgress } from './components/YearProgress'
import { useBirthday } from './hooks/useBirthday'
import { birthdayStorageKey } from './lib/birthday'
import { UI_TRANSITION } from './lib/motion'
import { readBoolean } from './lib/utils'

export default function App() {
  const birthday = useBirthday()
  const storageKey = birthdayStorageKey(birthday.now)
  const [celebrationStarted, setCelebrationStarted] = useState(
    () => birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`),
  )

  useEffect(() => {
    setCelebrationStarted(birthday.isBirthday && readBoolean(`${storageKey}:celebration-started`))
  }, [birthday.isBirthday, storageKey])

  return (
    <MotionConfig transition={UI_TRANSITION}>
      <div
        className={birthday.isBirthday ? 'app-shell birthday-mode' : 'app-shell ordinary-mode'}
        data-benming={birthday.benmingYear.isBenmingYear ? 'active' : 'inactive'}
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
              />
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  )
}
