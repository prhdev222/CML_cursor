import { ReactNode } from 'react';

/**
 * Patient Portal Layout - No Navigation or Footer
 * Patients should only see their own data
 */
export default function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}



