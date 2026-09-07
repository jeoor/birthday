interface AgeWatermarkProps {
  age: number
}

export function AgeWatermark({ age }: AgeWatermarkProps) {
  // 直接呈现当前年龄，不播放 0→年龄 的计数动画：
  // 巨型数字在计数过程中宽度与视觉重心会逐级位移，且刷新后会退回 0。
  return (
    <span className="age-watermark" aria-hidden="true">
      {age}
    </span>
  )
}
