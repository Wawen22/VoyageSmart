'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component that only renders children on the client side
 * This prevents hydration mismatches for components that use client-side only features
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component that wraps a component with ClientOnly
 */
export function withClientOnly<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: T) => (
    <ClientOnly fallback={fallback}>
      <Component {...props} />
    </ClientOnly>
  );

  WrappedComponent.displayName = `withClientOnly(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
