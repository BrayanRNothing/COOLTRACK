import { useContext } from 'react'
import WorkDataContext from './work-data-context'

export function useWorkData() {
  const context = useContext(WorkDataContext)
  if (!context) {
    throw new Error('useWorkData debe usarse dentro de WorkDataProvider')
  }

  return context
}
