import AdminLayout from '@/components/admin/admin-layout';

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}

