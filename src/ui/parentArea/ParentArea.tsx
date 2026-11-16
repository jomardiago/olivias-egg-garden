import { useState } from 'react'
import { exportBackup, starEntryHistory, type Command, type Garden, type GardenEvent, type LocalDate, type RejectionReason } from '../../garden/index.ts'
import './parentArea.css'

type Props = {
  garden: Garden
  today: LocalDate
  /** Sends a command to the Garden core and resolves with the events it returned. */
  onCommand: (command: Command) => Promise<GardenEvent[]>
  /** Back to the Garden. Also used after a change Olivia should see celebrated. */
  onClose: () => void
}

/**
 * The adult-only Parent Area, reached through the Parent Gate. Normal
 * readable text. Sections: add a missed day, the Star Entry history with
 * corrections. Later sections (name, sound, backup, reset) go below the history.
 */
export function ParentArea({ garden, today, onCommand, onClose }: Props) {
  const [message, setMessage] = useState<string | null>(null)

  /** Sends `command`; returns to the Garden when Stars went in, so the celebration and any Hatch play there. */
  const run = async (command: Command, saved: string): Promise<boolean> => {
    const events = await onCommand(command)
    const rejection = events.find((e) => e.type === 'CommandRejected')
    if (rejection) {
      setMessage(rejectionText(rejection.reason, garden.childName))
      return false
    }
    if (events.some((e) => e.type === 'StarsAdded' || e.type === 'StarsBanked' || e.type === 'ZeroStarDayRecorded' || e.type === 'EggHatched')) {
      onClose()
      return true
    }
    setMessage(saved)
    return true
  }

  return (
    <main className="parent-area">
      <header className="parent-area__header">
        <h1>Parent Area</h1>
        <button type="button" className="parent-area__button" onClick={onClose}>
          Back to the Garden
        </button>
      </header>

      <p className="parent-area__message" role="status" aria-live="polite">
        {message}
      </p>

      <MissedDayForm today={today} onAdd={(date, stars) => run({ type: 'AddMissedStarEntry', date, stars }, 'Added.')} />

      <section className="parent-area__section" aria-labelledby="history-heading">
        <h2 id="history-heading">Star Entry history</h2>
        {garden.starEntries.length === 0 ? (
          <p>No Star Entries yet.</p>
        ) : (
          <ul className="parent-area__history">
            {starEntryHistory(garden).map((entry) => (
              <HistoryRow
                key={entry.date}
                date={entry.date}
                stars={entry.stars}
                onCorrect={(stars) => run({ type: 'CorrectStarEntry', date: entry.date, stars }, `Changed ${formatDate(entry.date)} to ${starsText(stars)}.`)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="parent-area__section" aria-labelledby="sound-heading">
        <h2 id="sound-heading">Sound</h2>
        <label className="parent-area__checkbox">
          <input type="checkbox" checked={garden.muted} onChange={(e) => void onCommand({ type: 'SetMuted', muted: e.target.checked })} />
          Mute all sound
        </label>
      </section>

      <ChildNameForm key={garden.childName} name={garden.childName} onSave={(name) => run({ type: 'SetChildName', name }, `The name is now ${name.trim()}.`)} />

      <BackupSection
        garden={garden}
        today={today}
        onRestore={(backup) => run({ type: 'RestoreBackup', backup }, 'Backup restored. Everything is back exactly as it was saved.')}
        onFileProblem={setMessage}
      />

      <ResetSection onReset={() => run({ type: 'Reset' }, 'Everything was reset. A fresh Garden is ready.')} />
    </main>
  )
}

function ChildNameForm({ name, onSave }: { name: string; onSave: (name: string) => Promise<boolean> }) {
  const [value, setValue] = useState(name)

  return (
    <section className="parent-area__section" aria-labelledby="name-heading">
      <h2 id="name-heading">Child’s name</h2>
      <p className="parent-area__hint">Shown in the Garden title and the hatch celebrations.</p>
      <form
        className="parent-area__form"
        onSubmit={async (e) => {
          e.preventDefault()
          await onSave(value)
        }}
      >
        <label className="parent-area__field">
          Name
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <button type="submit" className="parent-area__button parent-area__button--primary" disabled={value.trim() === '' || value.trim() === name}>
          Save name
        </button>
      </form>
    </section>
  )
}

function BackupSection({
  garden,
  today,
  onRestore,
  onFileProblem,
}: {
  garden: Garden
  today: LocalDate
  onRestore: (backup: string) => Promise<boolean>
  onFileProblem: (message: string) => void
}) {
  const saveBackup = () => {
    const url = URL.createObjectURL(new Blob([exportBackup(garden)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `olivias-egg-garden-backup-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="parent-area__section" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Backup</h2>
      <p className="parent-area__hint">
        Everything lives only on this device. Save a backup file now and then and keep it somewhere safe, so a lost device does not lose the Collection.
      </p>
      <div className="parent-area__form">
        <button type="button" className="parent-area__button parent-area__button--primary" onClick={saveBackup}>
          Save backup
        </button>
        <label className="parent-area__field">
          Restore from a backup file (replaces everything now in the app)
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const input = e.target
              const file = input.files?.[0]
              if (!file) return
              try {
                await onRestore(await file.text())
              } catch {
                onFileProblem('That file could not be read. Nothing was changed.')
              }
              input.value = ''
            }}
          />
        </label>
      </div>
    </section>
  )
}

function ResetSection({ onReset }: { onReset: () => Promise<boolean> }) {
  const [step, setStep] = useState<0 | 1 | 2>(0)

  return (
    <section className="parent-area__section" aria-labelledby="reset-heading">
      <h2 id="reset-heading">Reset everything</h2>
      <p className="parent-area__hint">Deletes all Star Entries, Eggs and the Collection and starts a fresh Garden. Save a backup first if you may want it back.</p>
      {step === 0 && (
        <button type="button" className="parent-area__button parent-area__button--danger" onClick={() => setStep(1)}>
          Reset everything…
        </button>
      )}
      {step === 1 && (
        <div className="parent-area__form" role="alertdialog" aria-label="Confirm reset">
          <strong>Are you sure you want to reset everything?</strong>
          <button type="button" className="parent-area__button parent-area__button--danger" onClick={() => setStep(2)}>
            Yes, continue
          </button>
          <button type="button" className="parent-area__button" onClick={() => setStep(0)}>
            No, keep everything
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="parent-area__form" role="alertdialog" aria-label="Final confirmation">
          <strong>Last check: this cannot be undone. Really reset everything?</strong>
          <button
            type="button"
            className="parent-area__button parent-area__button--danger"
            onClick={async () => {
              await onReset()
              setStep(0)
            }}
          >
            Yes, reset everything
          </button>
          <button type="button" className="parent-area__button" onClick={() => setStep(0)}>
            No, keep everything
          </button>
        </div>
      )}
    </section>
  )
}

function MissedDayForm({ today, onAdd }: { today: LocalDate; onAdd: (date: LocalDate, stars: number) => Promise<boolean> }) {
  const [date, setDate] = useState('')
  const [stars, setStars] = useState(0)

  return (
    <section className="parent-area__section" aria-labelledby="missed-heading">
      <h2 id="missed-heading">Add a missed day</h2>
      <p className="parent-area__hint">For a past school day (Monday to Friday) that has no Stars yet.</p>
      <form
        className="parent-area__form"
        onSubmit={async (e) => {
          e.preventDefault()
          if (date && (await onAdd(date, stars))) setDate('')
        }}
      >
        <label className="parent-area__field">
          Date
          <input type="date" value={date} max={dayBefore(today)} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <StarsChoice label="Stars" value={stars} onChange={setStars} />
        <button type="submit" className="parent-area__button parent-area__button--primary" disabled={!date}>
          Add missed day
        </button>
      </form>
    </section>
  )
}

function HistoryRow({ date, stars, onCorrect }: { date: LocalDate; stars: number; onCorrect: (stars: number) => Promise<boolean> }) {
  const [editing, setEditing] = useState<number | null>(null)

  return (
    <li className="parent-area__entry">
      <span className="parent-area__date">{formatDate(date)}</span>
      {editing === null ? (
        <>
          <span className="parent-area__stars" aria-label={starsText(stars)}>
            {'★'.repeat(stars)}
            <span className="parent-area__stars-empty">{'☆'.repeat(3 - stars)}</span>
          </span>
          <button type="button" className="parent-area__button" onClick={() => setEditing(stars)}>
            Change
          </button>
        </>
      ) : (
        <div className="parent-area__edit">
          <StarsChoice label={`New Stars for ${formatDate(date)}`} value={editing} onChange={setEditing} />
          <button
            type="button"
            className="parent-area__button parent-area__button--primary"
            onClick={async () => {
              if (await onCorrect(editing)) setEditing(null)
            }}
          >
            Save
          </button>
          <button type="button" className="parent-area__button" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      )}
    </li>
  )
}

function StarsChoice({ label, value, onChange }: { label: string; value: number; onChange: (stars: number) => void }) {
  return (
    <div className="parent-area__choice" role="radiogroup" aria-label={label}>
      {[0, 1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          className="parent-area__choice-option"
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function rejectionText(reason: RejectionReason, childName: string): string {
  switch (reason) {
    case 'NotASchoolDay':
      return 'That day is a weekend. Stars are only for school days (Monday to Friday).'
    case 'NotAPastDate':
      return 'Pick a day before today. Today’s Stars go in from the Garden’s star button.'
    case 'AlreadyEntered':
    case 'AlreadyEnteredToday':
      return 'That day already has Stars. Use Change in the history below to correct them.'
    case 'AwaitingEggChoice':
      return `${childName} needs to choose her next Egg first. Then you can add the missed day.`
    case 'NoStarEntryOnDate':
      return 'That day has no Star Entry to change.'
    case 'EmptyName':
      return 'Please type a name.'
    case 'BackupCorrupt':
      return 'That file is not a valid Egg Garden backup. Nothing was changed.'
    case 'BackupUnknownVersion':
      return 'That backup was made by a different version of the app and cannot be used here. Nothing was changed.'
    case 'InvalidDate':
      return 'That is not a valid date.'
    case 'StarsOutOfRange':
      return 'Stars must be 0, 1, 2 or 3.'
    default:
      return 'That could not be saved.'
  }
}

function starsText(stars: number): string {
  return `${stars} Star${stars === 1 ? '' : 's'}`
}

function utcDate(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
}

function formatDate(date: LocalDate): string {
  return utcDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function dayBefore(date: LocalDate): LocalDate {
  const d = utcDate(date)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
