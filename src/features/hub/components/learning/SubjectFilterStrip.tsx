import { LEARNING_SUBJECTS } from '../../learning-semantics'

interface SubjectFilterStripProps {
  selectedSubject: string
  onSelectSubject: (subjectId: string) => void
}

export function SubjectFilterStrip({ selectedSubject, onSelectSubject }: SubjectFilterStripProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {LEARNING_SUBJECTS.map((subject) => {
        const isSelected = selectedSubject === subject.id

        return (
          <button
            key={subject.id}
            type="button"
            onClick={() => onSelectSubject(subject.id)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 border shrink-0 ${
              isSelected
                ? 'bg-brand border-brand text-primary-foreground shadow-md shadow-brand/15'
                : 'bg-surface/60 border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
            }`}
          >
            <span>{subject.label}</span>
          </button>
        )
      })}
    </div>
  )
}
