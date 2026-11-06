import { create } from 'zustand'
import { mockLots } from '../mocks'
import type { Lot } from '../types/lot'

interface LotState {
  lots: Lot[]
}

export const useLotStore = create<LotState>(() => ({
  lots: mockLots,
}))
