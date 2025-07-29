"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"

interface RunAwayButtonOptions {
  buttonRef: RefObject<HTMLElement>
  containerRef: RefObject<HTMLElement>
  shouldRunAway: boolean
}

export function useRunAwayButton({ buttonRef, containerRef, shouldRunAway }: RunAwayButtonOptions) {
  const [transformStyle, setTransformStyle] = useState({ transform: "translate(0px, 0px)" })

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!shouldRunAway || !buttonRef.current || !containerRef.current) {
        setTransformStyle({ transform: "translate(0px, 0px)" })
        return
      }

      const buttonRect = buttonRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      // Mouse position relative to the container
      const mouseX = event.clientX - containerRect.left
      const mouseY = event.clientY - containerRect.top

      // Button center relative to the container
      const buttonCenterX = buttonRect.left - containerRect.left + buttonRect.width / 2
      const buttonCenterY = buttonRect.top - containerRect.top + buttonRect.height / 2

      const distanceX = mouseX - buttonCenterX
      const distanceY = mouseY - buttonCenterY
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

      const triggerDistance = 100 // Distance from button center to trigger movement
      const moveAmount = 50 // How far to move the button

      if (distance < triggerDistance) {
        const angle = Math.atan2(distanceY, distanceX)

        let newX = -Math.cos(angle) * moveAmount
        let newY = -Math.sin(angle) * moveAmount

        // Clamp the translation to a maximum range from its original position
        // This ensures the button stays within a reasonable area around its starting point
        const maxTranslationRange = 150 // Max pixels the button can translate from its original spot
        newX = Math.max(-maxTranslationRange, Math.min(maxTranslationRange, newX))
        newY = Math.max(-maxTranslationRange, Math.min(maxTranslationRange, newY))

        setTransformStyle({ transform: `translate(${newX}px, ${newY}px)` })
      } else {
        setTransformStyle({ transform: "translate(0px, 0px)" })
      }
    },
    [shouldRunAway, buttonRef, containerRef],
  )

  useEffect(() => {
    const currentContainer = containerRef.current
    if (currentContainer) {
      currentContainer.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [containerRef, handleMouseMove])

  return transformStyle
}
