import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  children: React.ReactNode;
}

export default function LazyLoad({ children }: LazyLoadProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
