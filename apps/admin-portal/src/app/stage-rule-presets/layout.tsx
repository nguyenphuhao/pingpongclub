import AdminLayout from '@/components/admin/admin-layout';

export default function StageRulePresetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
