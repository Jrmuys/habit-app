import ProtectedLayout from '@/components/ProtectedLayout'; // Adjust the import path

// This layout wraps every page inside the (protected) group.
export default function Layout({ children }: { children: React.ReactNode }) {
   return <ProtectedLayout>{children}</ProtectedLayout>;
}
