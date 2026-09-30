"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VoucherStatus,
  type Voucher,
} from "@/lib/types";
import type { VoucherFormValues } from "@/lib/validation";
import {
  getVouchersAction,
  createVoucherAction,
  updateVoucherStatusAction,
  getNextVoucherNumber,
} from "@/server/vouchers";

export interface VoucherStore {
  vouchers: Voucher[];
  isLoading: boolean;
  currentVoucherNumber: string;
  getVoucher: (id: string) => Voucher | undefined;
  createVoucher: (
    values: VoucherFormValues,
    status: VoucherStatus
  ) => Promise<Voucher>;
  updateVoucherStatus: (
    id: string,
    status: VoucherStatus,
    note?: string
  ) => Promise<void>;
  deleteVoucher: (id: string) => void;
  refreshVouchers: () => Promise<void>;
}

export function useVouchers(): VoucherStore {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVoucherNumber, setCurrentVoucherNumber] = useState<string>("PV-10013");

  const loadVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, nextNum] = await Promise.all([
        getVouchersAction(),
        getNextVoucherNumber(),
      ]);
      setVouchers(data);
      setCurrentVoucherNumber(nextNum);
    } catch (err) {
      console.error("Failed to load vouchers from Neon DB:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [data, nextNum] = await Promise.all([
          getVouchersAction(),
          getNextVoucherNumber(),
        ]);
        if (!ignore) {
          setVouchers(data);
          setCurrentVoucherNumber(nextNum);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load vouchers:", err);
        if (!ignore) setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const getVoucher = useCallback(
    (id: string) => vouchers.find((voucher) => voucher.id === id),
    [vouchers]
  );

  const createVoucher = useCallback(
    async (values: VoucherFormValues, status: VoucherStatus): Promise<Voucher> => {
      const res = await createVoucherAction(values, status);
      if (!res.success || !res.voucher) {
        throw new Error(res.error || "Failed to create voucher");
      }
      setVouchers((prev) => [res.voucher!, ...prev]);
      return res.voucher;
    },
    []
  );

  const updateVoucherStatus = useCallback(
    async (id: string, status: VoucherStatus, note?: string) => {
      const res = await updateVoucherStatusAction(id, status, note);
      if (!res.success || !res.voucher) {
        throw new Error(res.error || "Failed to update voucher");
      }
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? res.voucher! : v))
      );
    },
    []
  );

  const deleteVoucher = useCallback((id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return {
    vouchers,
    isLoading,
    currentVoucherNumber,
    getVoucher,
    createVoucher,
    updateVoucherStatus,
    deleteVoucher,
    refreshVouchers: loadVouchers,
  };
}