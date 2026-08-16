"use client";

import { useRouter } from "next/navigation";
import { resetToDemo } from "@/lib/storage";

export function ResetToDemoButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        resetToDemo();
        router.push("/");
      }}
      className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
      style={{ background: "var(--canopy)", color: "var(--bg-raised)" }}
    >
      Reset to the demo diary
    </button>
  );
}
