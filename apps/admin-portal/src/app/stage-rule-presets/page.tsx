import { getStageRulePresets } from '@/app/tournaments/actions';
import { StageRulePresetsClient } from './presets-client';

export const metadata = {
  title: 'Stage Rule Presets',
  description: 'Quản lý preset cho stage rules',
};

export default async function StageRulePresetsPage() {
  const presets = await getStageRulePresets();

  return <StageRulePresetsClient initialPresets={presets} />;
}
