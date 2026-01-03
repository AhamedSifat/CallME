import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLoginStore = create(
  persist(
    (set) => ({
      step: 1,
      usePhoneData: null,
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ usePhoneData: data }),
      resetLoginState: () => set({ step: 1, usePhoneData: null }),
    }),
    {
      name: 'login-storage',
      partialize: (state) => ({
        step: state.step,
        usePhoneData: state.usePhoneData,
      }),
    }
  )
);

export default useLoginStore;
