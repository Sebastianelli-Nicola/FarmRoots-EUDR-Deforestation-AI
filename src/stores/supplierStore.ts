import { create } from 'zustand'
import { mockSuppliers } from '../mocks'
import type { Supplier } from '../types/supplier'

interface SupplierState {
  suppliers: Supplier[]
  suspendSupplier: (id: string) => void
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: mockSuppliers,
  suspendSupplier: (id: string) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) =>
        s.id === id
          ? { ...s, suspended: true, suspendedAt: new Date().toISOString() }
          : s
      ),
    })),
}))
