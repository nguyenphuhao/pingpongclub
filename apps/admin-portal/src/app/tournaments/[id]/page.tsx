import { getStageRulePresets, getStagesWithRules, getTournamentById } from '../actions';
import { TournamentDetailClient } from './tournament-detail-client';
import { getParticipants } from '../actions';

interface TournamentDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    participantPage?: string;
    participantSearch?: string;
    participantStatus?: string;
    participantOrderBy?: 'createdAt' | 'displayName' | 'seed';
    participantOrder?: 'asc' | 'desc';
  };
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: TournamentDetailPageProps) {
  const participantPage = Number(searchParams.participantPage) || 1;

  const [tournament, stagesResult, rulePresets, participantsResult] = await Promise.all([
    getTournamentById(params.id),
    getStagesWithRules(params.id, { orderBy: 'stageOrder', order: 'asc' }),
    getStageRulePresets(),
    getParticipants(params.id, {
      page: participantPage,
      limit: 20,
      search: searchParams.participantSearch,
      status: searchParams.participantStatus,
      orderBy: searchParams.participantOrderBy || 'seed',
      order: searchParams.participantOrder || 'asc',
    }),
  ]);

  return (
    <TournamentDetailClient
      tournament={tournament}
      initialStages={stagesResult.data}
      initialPagination={stagesResult.pagination}
      rulePresets={rulePresets}
      initialParticipants={participantsResult.data}
      participantPagination={participantsResult.pagination}
      participantSearchParams={searchParams}
    />
  );
}
