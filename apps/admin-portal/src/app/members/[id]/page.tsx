import { getMemberById } from '../actions';
import { MemberDetailClient } from './member-detail-client';
import { notFound } from 'next/navigation';

interface MemberDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: MemberDetailPageProps) {
  try {
    const member = await getMemberById(params.id);
    return {
      title: `${member.displayName || member.nickname || 'Thành viên'} - Quản lý Thành viên`,
    };
  } catch {
    return {
      title: 'Thành viên không tồn tại',
    };
  }
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  try {
    const member = await getMemberById(params.id);
    return <MemberDetailClient member={member} />;
  } catch (error) {
    notFound();
  }
}

