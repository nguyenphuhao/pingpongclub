import { getMemberById } from '../../actions';
import { EditMemberForm } from './edit-member-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Chỉnh sửa Thành viên',
  description: 'Chỉnh sửa thông tin thành viên câu lạc bộ',
};

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const member = await getMemberById(params.id);

  if (!member) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/members/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa Thành viên</h1>
          <p className="text-muted-foreground">
            {member.displayName || member.nickname || member.email}
          </p>
        </div>
      </div>
      <EditMemberForm member={member} />
    </div>
  );
}



