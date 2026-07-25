interface AgeDisplayProps {
  age: number
}

export function AgeDisplay({ age }: AgeDisplayProps) {
  return (
    <div className="age-display">
      <strong aria-label={`${age} 岁`}>{age}</strong>
      <span aria-hidden="true">岁</span>
    </div>
  )
}
