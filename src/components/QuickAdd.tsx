import { createContext, useContext, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TransactionForm } from "./TransactionForm";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useQuickAdd = () => useContext(Ctx);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick add transaction"
        className="bg-header-gradient fixed bottom-24 end-5 z-40 flex size-16 items-center justify-center rounded-full text-primary-foreground shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 md:bottom-8 md:end-8"
      >
        <Plus className="size-8" />
      </button>
      <Drawer open={isOpen} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-lg">
          <DrawerHeader className="text-start">
            <DrawerTitle className="font-display">Quick add</DrawerTitle>
            <DrawerDescription>Log spending. Use ± for refunds or withdrawals.</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[75vh] overflow-y-auto px-4 pb-6">
            {isOpen && <TransactionForm onDone={() => setOpen(false)} />}
          </div>
        </DrawerContent>
      </Drawer>
    </Ctx.Provider>
  );
}
