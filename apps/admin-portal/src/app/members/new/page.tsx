import { AddMemberForm } from './add-member-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Thêm Thành viên Mới',
  description: 'Thêm thành viên mới vào câu lạc bộ',
};

export default function AddMemberPage() {
  return (
    <div className="container max-w-2xl py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Thêm Thành viên Mới</h1>
          <p className="text-muted-foreground">Điền thông tin cơ bản để tạo thành viên mới</p>
        </div>
      </div>
      <AddMemberForm />
    </div>
  );
}




