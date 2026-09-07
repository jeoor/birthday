/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { MinimalCake } from '../components/MinimalCake'

describe('MinimalCake', () => {
  test('uses the extinguished artwork before candles are lit', () => {
    const { container } = render(
      <MinimalCake
        buttonRef={createRef<HTMLButtonElement>()}
        candleState="unlit"
        onBlow={vi.fn()}
      />,
    )

    const image = container.querySelector('img')
    expect(image?.getAttribute('src')).toContain(
      'birthday-cake-extinguished-final.webp',
    )
  })
})
