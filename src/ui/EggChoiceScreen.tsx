import { useState } from 'react'
import { eggPattern, findEggFamily } from '../catalog/index.ts'
import type { Command } from '../garden/index.ts'

type Props = {
  childName: string
  familyIds: string[]
  onCommand: (command: Command) => Promise<unknown>
}

/** One big Egg per available Egg Family; tapping one chooses it. The Character inside stays a surprise. */
export function EggChoiceScreen({ childName, familyIds, onCommand }: Props) {
  const [choosing, setChoosing] = useState(false)

  return (
    <main className="egg-choice">
      <h1 className="garden__title">{childName}, pick your next Egg!</h1>
      <div className="egg-choice__eggs">
        {familyIds.map((familyId) => {
          const Pattern = eggPattern(familyId)
          return (
            <button
              key={familyId}
              type="button"
              className="egg-choice__egg"
              aria-label={`${findEggFamily(familyId)?.name ?? familyId} Egg`}
              disabled={choosing}
              onClick={async () => {
                setChoosing(true)
                await onCommand({ type: 'ChooseEgg', familyId })
                setChoosing(false)
              }}
            >
              <Pattern familyId={familyId} size={150} />
            </button>
          )
        })}
      </div>
    </main>
  )
}
