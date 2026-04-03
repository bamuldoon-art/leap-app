import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStored = useCallback((val) => {
    try {
      const toStore = typeof val === 'function' ? val(value) : val
      setValue(toStore)
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch (e) {
      console.warn('localStorage error:', e)
    }
  }, [key, value])

  return [value, setStored]
}
