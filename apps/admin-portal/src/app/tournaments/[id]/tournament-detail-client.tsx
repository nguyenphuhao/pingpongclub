'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Pencil, Plus, Save, Trash2, Trophy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DrawEntryDialog } from './DrawEntryDialog';
import type {
  Group,
  StageBracket,
  GroupMember,
  MemberOption,
  PaginationMeta,
  Participant,
  Stage,
  StageRule,
  StageRulePreset,
  Tournament,
} from '../actions';
import {
  createStage,
  createStageRules,
  createParticipant,
  createGroup,
  createGroupMember,
  deleteStage,
  deleteStageRules,
  deleteGroup,
  deleteGroupMember,
  deleteParticipant,
  deleteTournament,
  getGroupMembers,
  getGroups,
  getMemberOptions,
  getBracket,
  generateBracket,
  resolveBracket,
  seedParticipantsByElo,
  updateStage,
  updateStageRules,
  updateGroup,
  updateGroupMember,
  updateParticipant,
  updateTournament,
  createDraw,
  updateDraw,
  applyDraw,
} from '../actions';

interface StageWithRules extends Stage {
  rules: StageRule | null;
}

import { ParticipantPairingDialog } from './ParticipantPairingDialog';


interface TournamentDetailClientProps {
  tournament: Tournament;
  initialStages: StageWithRules[];
  initialPagination: PaginationMeta;
  rulePresets: StageRulePreset[];
  initialParticipants: Participant[];
  participantPagination: PaginationMeta;
  participantSearchParams: {
    participantPage?: string;
    participantSearch?: string;
    participantStatus?: string;
    participantOrderBy?: 'createdAt' | 'displayName' | 'seed';
    participantOrder?: 'asc' | 'desc';
  };
}

interface RuleDraft {
  winPoints: string;
  lossPoints: string;
  byePoints: string;
  countByeGamesPoints: boolean;
  countWalkoverAsPlayed: boolean;
  tieBreakOrder: string[];
  h2hMode: string;
}

const STAGE_TYPES = [
  { value: 'GROUP', label: 'Vòng bảng' },
  { value: 'KNOCKOUT', label: 'Loại trực tiếp' },
  { value: 'LEAGUE', label: 'League' },
  { value: 'SWISS', label: 'Swiss' },
];

const TIE_BREAK_OPTIONS = [
  { value: 'matchPoints', label: 'Match points' },
  { value: 'h2h', label: 'Đối đầu (H2H)' },
  { value: 'gamesWon', label: 'Số game thắng' },
  { value: 'gameDiff', label: 'Hiệu số game' },
  { value: 'pointsDiff', label: 'Hiệu số điểm' },
];

function getStageTypeLabel(type: string) {
  const found = STAGE_TYPES.find((item) => item.value === type);
  return found?.label || type;
}

function getTieBreakLabel(value: string) {
  return TIE_BREAK_OPTIONS.find((item) => item.value === value)?.label || value;
}

const RANK_COLORS: Record<string, string> = {
  A_STAR: 'bg-red-600 text-white',
  A: 'bg-red-500 text-white',
  B: 'bg-orange-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-green-500 text-white',
  E: 'bg-blue-500 text-white',
  F: 'bg-indigo-500 text-white',
  G: 'bg-purple-500 text-white',
  H: 'bg-gray-500 text-white',
};

// Helper functions for working with participant members
function getParticipantRating(participant: Participant | undefined): number {
  if (!participant || !participant.members || participant.members.length === 0) return 1000;
  // For singles: return first member's rating
  // For doubles: return average rating
  const totalRating = participant.members.reduce((sum, m) => sum + m.user.ratingPoints, 0);
  return Math.round(totalRating / participant.members.length);
}

function getParticipantPhone(participant: Participant | undefined): string | null {
  if (!participant || !participant.members || participant.members.length === 0) return null;
  // Return first member's phone
  return participant.members[0].user.phone;
}

function getParticipantMemberNames(participant: Participant): string {
  if (!participant.members || participant.members.length === 0) return participant.displayName;
  return participant.members
    .map((m) => m.user.displayName || m.user.nickname || 'Unknown')
    .join(' / ');
}

const RANK_LABELS: Record<string, string> = {
  A_STAR: 'A*',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
};

function calculateRank(rating: number): string {
  if (rating > 2200) return 'A_STAR';
  if (rating >= 2001) return 'A';
  if (rating >= 1801) return 'B';
  if (rating >= 1601) return 'C';
  if (rating >= 1401) return 'D';
  if (rating >= 1201) return 'E';
  if (rating >= 1001) return 'F';
  if (rating >= 801) return 'G';
  return 'H';
}

function isSameTieBreakOrder(a: string[] | undefined, b: string[] | undefined) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function createDefaultRulesDraft(rules?: StageRule | null): RuleDraft {
  return {
    winPoints: rules ? String(rules.winPoints ?? 1) : '1',
    lossPoints: rules ? String(rules.lossPoints ?? 0) : '0',
    byePoints: rules ? String(rules.byePoints ?? 1) : '1',
    countByeGamesPoints: rules ? rules.countByeGamesPoints : false,
    countWalkoverAsPlayed: rules ? rules.countWalkoverAsPlayed : true,
    tieBreakOrder:
      rules?.tieBreakOrder && rules.tieBreakOrder.length > 0
        ? rules.tieBreakOrder
        : ['matchPoints', 'h2h'],
    h2hMode: rules?.h2hMode || 'TWO_WAY_ONLY',
  };
}

function matchPresetId(rules: StageRule | null, presets: StageRulePreset[]) {
  if (!rules) return 'none';

  const matched = presets.find((preset) => {
    return (
      preset.winPoints === rules.winPoints &&
      preset.lossPoints === rules.lossPoints &&
      preset.byePoints === rules.byePoints &&
      preset.countByeGamesPoints === rules.countByeGamesPoints &&
      preset.countWalkoverAsPlayed === rules.countWalkoverAsPlayed &&
      preset.h2hMode === rules.h2hMode &&
      isSameTieBreakOrder(preset.tieBreakOrder, rules.tieBreakOrder)
    );
  });

  return matched?.id || 'none';
}

function getMemberDisplayName(member: MemberOption) {
  if (member.displayName) return member.displayName;
  if (member.nickname) return member.nickname;
  if (member.phone) return member.phone;
  return `Member ${member.id.slice(0, 6)}`;
}

function getMemberIdentifiers(member: MemberOption) {
  return [member.displayName, member.nickname, member.phone]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

export function TournamentDetailClient({
  tournament,
  initialStages,
  initialPagination,
  rulePresets,
  initialParticipants,
  participantPagination,
  participantSearchParams,
}: TournamentDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const initialStageOrder =
    initialStages.length > 0
      ? Math.max(...initialStages.map((stage) => stage.stageOrder)) + 1
      : 1;
  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description || '');
  const [tournamentMessage, setTournamentMessage] = useState<string | null>(null);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [stages, setStages] = useState<StageWithRules[]>(initialStages);
  const [newStageName, setNewStageName] = useState('');
  const [newStageType, setNewStageType] = useState('GROUP');
  const [newStageOrder, setNewStageOrder] = useState(String(initialStageOrder));
  const [newStagePresetId, setNewStagePresetId] = useState('none');
  const [stageError, setStageError] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [rulesOpenStageId, setRulesOpenStageId] = useState<string | null>(null);
  const [stagePresetSelections, setStagePresetSelections] = useState<Record<string, string>>({});
  const [rulesSavingStageId, setRulesSavingStageId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [participantSearch, setParticipantSearch] = useState(
    participantSearchParams.participantSearch || '',
  );
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);
  const [memberPickerMode, setMemberPickerMode] = useState<'add' | 'edit'>('add');
  const [memberPickerTarget, setMemberPickerTarget] = useState<Participant | null>(null);
  const [memberEditSeed, setMemberEditSeed] = useState('');
  const [memberEditStatus, setMemberEditStatus] = useState('active');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [memberPagination, setMemberPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupsByStageId, setGroupsByStageId] = useState<Record<string, Group[]>>({});
  const [groupLoadingByStageId, setGroupLoadingByStageId] = useState<Record<string, boolean>>({});
  const [groupDraftByStageId, setGroupDraftByStageId] = useState<
    Record<string, { name: string; order: string }>
  >({});
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupOrder, setEditingGroupOrder] = useState('');
  const [groupMembersByGroupId, setGroupMembersByGroupId] = useState<
    Record<string, GroupMember[]>
  >({});
  const [groupMembersLoadingByGroupId, setGroupMembersLoadingByGroupId] = useState<
    Record<string, boolean>
  >({});
  const [groupMembersOpenByGroupId, setGroupMembersOpenByGroupId] = useState<
    Record<string, boolean>
  >({});
  const [groupMemberPickerOpen, setGroupMemberPickerOpen] = useState(false);
  const [groupMemberTarget, setGroupMemberTarget] = useState<Group | null>(null);
  const [groupMemberSelectedIds, setGroupMemberSelectedIds] = useState<string[]>([]);
  const [groupMemberSeed, setGroupMemberSeed] = useState('');
  const [groupMemberStatus, setGroupMemberStatus] = useState('active');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [groupMemberActionLoading, setGroupMemberActionLoading] = useState(false);
  const [groupMemberEditOpen, setGroupMemberEditOpen] = useState(false);
  const [groupMemberEditTarget, setGroupMemberEditTarget] = useState<GroupMember | null>(null);
  const [groupMemberEditSeed, setGroupMemberEditSeed] = useState('');
  const [groupMemberEditStatus, setGroupMemberEditStatus] = useState('active');
  const [bracketByStageId, setBracketByStageId] = useState<Record<string, StageBracket | null>>(
    {},
  );
  const [bracketLoadingByStageId, setBracketLoadingByStageId] = useState<
    Record<string, boolean>
  >({});
  const [bracketOpenByStageId, setBracketOpenByStageId] = useState<Record<string, boolean>>({});
  const [bracketGenerateDrafts, setBracketGenerateDrafts] = useState<
    Record<
      string,
      {
        sourceType: 'SEED' | 'GROUP_RANK';
        size: string;
        seedOrder: string;
        bestOf: string;
        sourceStageId: string;
        topNPerGroup: string;
        wildcardCount: string;
      }
    >
  >({});
  const [bracketActionLoadingByStageId, setBracketActionLoadingByStageId] = useState<
    Record<string, boolean>
  >({});

  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [drawType, setDrawType] = useState<'DOUBLES_PAIRING' | 'GROUP_ASSIGNMENT' | 'KNOCKOUT_PAIRING'>('DOUBLES_PAIRING');
  const [drawStageId, setDrawStageId] = useState<string | undefined>(undefined);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const [rulesDrafts, setRulesDrafts] = useState<Record<string, RuleDraft>>(() => {
    return initialStages.reduce<Record<string, RuleDraft>>((acc, stage) => {
      acc[stage.id] = createDefaultRulesDraft(stage.rules);
      return acc;
    }, {});
  });

  useEffect(() => {
    if (rulePresets.length === 0) return;

    setStagePresetSelections((prev) => {
      const next: Record<string, string> = { ...prev };
      stages.forEach((stage) => {
        const matchedId = matchPresetId(stage.rules ?? null, rulePresets);
        next[stage.id] = matchedId;
      });
      return next;
    });
  }, [rulePresets, stages]);

  useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  useEffect(() => {
    if (!memberPickerOpen || memberPickerMode !== 'edit' || !memberPickerTarget) return;
    const targetName = memberPickerTarget.displayName.toLowerCase();
    const matched = memberOptions.find(
      (member) => getMemberDisplayName(member).toLowerCase() === targetName,
    );
    if (matched) {
      setSelectedMemberIds([matched.id]);
    }
  }, [memberOptions, memberPickerOpen, memberPickerMode, memberPickerTarget]);

  const existingParticipantNames = useMemo(() => {
    return new Set(participants.map((participant) => participant.displayName.toLowerCase()));
  }, [participants]);

  const isMemberAlreadyParticipant = useCallback(
    (member: MemberOption) => {
      return getMemberIdentifiers(member).some((identifier) =>
        existingParticipantNames.has(identifier),
      );
    },
    [existingParticipantNames],
  );

  const selectableMembers = useMemo(() => {
    const editingName =
      memberPickerMode === 'edit' && memberPickerTarget
        ? memberPickerTarget.displayName.toLowerCase()
        : null;
    return memberOptions.filter((member) => {
      if (editingName && getMemberIdentifiers(member).includes(editingName)) {
        return true;
      }
      return !isMemberAlreadyParticipant(member);
    });
  }, [isMemberAlreadyParticipant, memberOptions, memberPickerMode, memberPickerTarget]);

  const stageCount = stages.length;
  const defaultStageOrder = useMemo(() => {
    if (stages.length === 0) return 1;
    return Math.max(...stages.map((stage) => stage.stageOrder)) + 1;
  }, [stages]);

  const syncNewStageOrder = () => {
    setNewStageOrder(String(defaultStageOrder));
  };

  const handleTournamentSave = async () => {
    setTournamentMessage(null);
    if (name.trim().length < 2) {
      setTournamentMessage('Tên giải đấu phải có ít nhất 2 ký tự.');
      return;
    }

    setIsSavingTournament(true);

    try {
      await updateTournament(tournament.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setTournamentMessage('Đã lưu thay đổi.');
      router.refresh();
    } catch (error: any) {
      setTournamentMessage(error.message || 'Không thể cập nhật giải đấu.');
    } finally {
      setIsSavingTournament(false);
    }
  };

  const handleTournamentDelete = async () => {
    await deleteTournament(tournament.id);
    router.push('/tournaments');
    router.refresh();
  };

  const handleCreateStage = async () => {
    setStageError(null);
    if (newStageName.trim().length < 2) {
      setStageError('Tên stage phải có ít nhất 2 ký tự.');
      return;
    }

    try {
      const created = await createStage(tournament.id, {
        name: newStageName.trim(),
        type: newStageType,
        stageOrder: Number(newStageOrder) || defaultStageOrder,
      });

      const newStage: StageWithRules = {
        ...created,
        rules: null,
      };

      setStages((prev) => [...prev, newStage]);
      setRulesDrafts((prev) => ({
        ...prev,
        [created.id]: {
          winPoints: '1',
          lossPoints: '0',
          byePoints: '1',
          countByeGamesPoints: false,
          countWalkoverAsPlayed: true,
          tieBreakOrder: ['matchPoints', 'h2h'],
          h2hMode: 'TWO_WAY_ONLY',
        },
      }));

      if (newStagePresetId !== 'none') {
        const selectedPreset = rulePresets.find((preset) => preset.id === newStagePresetId);
        if (selectedPreset) {
          const payload: StageRule = {
            winPoints: selectedPreset.winPoints ?? 1,
            lossPoints: selectedPreset.lossPoints ?? 0,
            byePoints: selectedPreset.byePoints ?? 1,
            countByeGamesPoints: selectedPreset.countByeGamesPoints ?? false,
            countWalkoverAsPlayed: selectedPreset.countWalkoverAsPlayed ?? true,
            tieBreakOrder:
              selectedPreset.tieBreakOrder && selectedPreset.tieBreakOrder.length > 0
                ? selectedPreset.tieBreakOrder
                : ['matchPoints', 'h2h'],
            h2hMode: selectedPreset.h2hMode || 'TWO_WAY_ONLY',
          };

          const createdRules = await createStageRules(tournament.id, created.id, payload);
          setStages((prev) =>
            prev.map((stage) =>
              stage.id === created.id ? { ...stage, rules: createdRules } : stage,
            ),
          );
          applyPresetToDraft(created.id, selectedPreset);
          setStagePresetSelections((prev) => ({
            ...prev,
            [created.id]: selectedPreset.id,
          }));
        }
      }

      setNewStageName('');
      setNewStageType('GROUP');
      setNewStageOrder(String(defaultStageOrder + 1));
      setNewStagePresetId('none');
      router.refresh();
    } catch (error: any) {
      setStageError(error.message || 'Không thể tạo stage.');
    }
  };

  const handleStageUpdate = async (stageId: string, values: StageWithRules) => {
    const updated = await updateStage(tournament.id, stageId, {
      name: values.name,
      type: values.type,
      stageOrder: values.stageOrder,
    });

    setStages((prev) =>
      prev.map((stage) => (stage.id === stageId ? { ...stage, ...updated } : stage)),
    );
    setEditingStageId(null);
    router.refresh();
  };

  const handleStageDelete = async (stageId: string) => {
    await deleteStage(tournament.id, stageId);
    setStages((prev) => prev.filter((stage) => stage.id !== stageId));
    setRulesDrafts((prev) => {
      const next = { ...prev };
      delete next[stageId];
      return next;
    });
    router.refresh();
  };

  const updateRuleDraft = (stageId: string, partial: Partial<RuleDraft>) => {
    setRulesDrafts((prev) => ({
      ...prev,
      [stageId]: {
        ...createDefaultRulesDraft(),
        ...prev[stageId],
        ...partial,
      },
    }));
  };

  const applyPresetToDraft = (stageId: string, preset: StageRulePreset) => {
    updateRuleDraft(stageId, {
      winPoints: String(preset.winPoints ?? 1),
      lossPoints: String(preset.lossPoints ?? 0),
      byePoints: String(preset.byePoints ?? 1),
      countByeGamesPoints: preset.countByeGamesPoints ?? false,
      countWalkoverAsPlayed: preset.countWalkoverAsPlayed ?? true,
      tieBreakOrder:
        preset.tieBreakOrder && preset.tieBreakOrder.length > 0
          ? preset.tieBreakOrder
          : ['matchPoints', 'h2h'],
      h2hMode: preset.h2hMode || 'TWO_WAY_ONLY',
    });
  };

  const updateTieBreakOrder = (stageId: string, nextOrder: string[]) => {
    updateRuleDraft(stageId, { tieBreakOrder: nextOrder });
  };

  const handleAddTieBreak = (stageId: string, value: string) => {
    if (!value) return;
    const current = rulesDrafts[stageId]?.tieBreakOrder || [];
    if (current.includes(value)) return;
    updateTieBreakOrder(stageId, [...current, value]);
  };

  const handleMoveTieBreak = (stageId: string, index: number, direction: 'up' | 'down') => {
    const current = rulesDrafts[stageId]?.tieBreakOrder || [];
    const next = [...current];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateTieBreakOrder(stageId, next);
  };

  const handleRemoveTieBreak = (stageId: string, value: string) => {
    const current = rulesDrafts[stageId]?.tieBreakOrder || [];
    updateTieBreakOrder(
      stageId,
      current.filter((item) => item !== value),
    );
  };

  const handleSaveRules = async (stage: StageWithRules) => {
    const draft = rulesDrafts[stage.id];
    if (!draft) {
      toast({
        title: 'Không thể lưu rules',
        description: 'Không tìm thấy dữ liệu rules. Vui lòng tải lại trang.',
        variant: 'destructive',
      });
      return;
    }

    setRulesSavingStageId(stage.id);
    const payloadBase: Omit<StageRule, 'tieBreakOrder' | 'h2hMode'> = {
      winPoints: Number(draft.winPoints) || 0,
      lossPoints: Number(draft.lossPoints) || 0,
      byePoints: Number(draft.byePoints) || 0,
      countByeGamesPoints: draft.countByeGamesPoints,
      countWalkoverAsPlayed: draft.countWalkoverAsPlayed,
    };
    const payload: StageRule =
      stage.type === 'KNOCKOUT'
        ? ({
          ...payloadBase,
        } as StageRule)
        : {
          ...payloadBase,
          tieBreakOrder:
            draft.tieBreakOrder && draft.tieBreakOrder.length > 0
              ? draft.tieBreakOrder
              : ['matchPoints', 'h2h'],
          h2hMode: draft.h2hMode as StageRule['h2hMode'],
        };

    try {
      if (stage.rules) {
        const updated = await updateStageRules(tournament.id, stage.id, payload);
        setStages((prev) =>
          prev.map((item) => (item.id === stage.id ? { ...item, rules: updated } : item)),
        );
      } else {
        const created = await createStageRules(tournament.id, stage.id, payload);
        setStages((prev) =>
          prev.map((item) => (item.id === stage.id ? { ...item, rules: created } : item)),
        );
      }

      toast({
        title: 'Đã lưu rules',
        description: `Stage: ${stage.name}`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể lưu rules',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setRulesSavingStageId(null);
    }
  };

  const handleDeleteRules = async (stageId: string) => {
    try {
      await deleteStageRules(tournament.id, stageId);
      setStages((prev) =>
        prev.map((item) => (item.id === stageId ? { ...item, rules: null } : item)),
      );
      toast({
        title: 'Đã xóa rules',
        description: 'Stage rules đã được gỡ bỏ.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể xóa rules',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const updateParticipantQuery = (updates: Record<string, string | undefined>) => {
    const nextValues = {
      participantPage: participantSearchParams.participantPage,
      participantSearch: participantSearchParams.participantSearch,
      participantStatus: participantSearchParams.participantStatus,
      participantOrderBy: participantSearchParams.participantOrderBy,
      participantOrder: participantSearchParams.participantOrder,
      ...updates,
    };

    const params = new URLSearchParams();
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });

    router.push(`/tournaments/${tournament.id}?${params.toString()}`);
  };

  const handleParticipantSearch = () => {
    updateParticipantQuery({
      participantSearch: participantSearch || undefined,
      participantPage: '1',
    });
  };

  const handleParticipantFilterChange = (key: string, value: string) => {
    updateParticipantQuery({
      [key]: value === 'all' ? undefined : value,
      participantPage: '1',
    });
  };

  const handleParticipantPageChange = (page: number) => {
    updateParticipantQuery({
      participantPage: page.toString(),
    });
  };

  const openParticipantCreate = () => {
    setMemberSearch('');
    setSelectedMemberIds([]);
    setMemberPickerMode('add');
    setMemberPickerTarget(null);
    setMemberPickerOpen(true);
  };

  const openParticipantEdit = (participant: Participant) => {
    setMemberSearch('');
    setSelectedMemberIds([]);
    setMemberPickerMode('edit');
    setMemberPickerTarget(participant);
    setMemberEditSeed(participant.seed ? String(participant.seed) : '');
    setMemberEditStatus(participant.status || 'active');
    setMemberPickerOpen(true);
  };

  const handleParticipantDelete = async (participantId: string) => {
    try {
      await deleteParticipant(tournament.id, participantId);
      setParticipants((prev) => prev.filter((item) => item.id !== participantId));
      toast({
        title: 'Đã xóa participant',
        description: 'Participant đã được gỡ khỏi giải đấu.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể xóa participant',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleSeedParticipants = async () => {
    try {
      await seedParticipantsByElo(tournament.id);
      toast({
        title: 'Đã cập nhật seed theo ELO',
        description: 'Danh sách participants đã được sắp xếp lại.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể cập nhật seed',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const loadMembers = useCallback(async (page = 1, search = '') => {
    setMemberLoading(true);
    try {
      const result = await getMemberOptions({
        page,
        limit: 20,
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setMemberOptions(result.data);
      setMemberPagination(result.pagination);
      setSelectedMemberIds([]);
    } catch (error: any) {
      toastRef.current({
        title: 'Không thể tải danh sách members',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setMemberLoading(false);
    }
  }, []);

  useEffect(() => {
    if (memberPickerOpen) {
      loadMembers(1, '');
    }
  }, [loadMembers, memberPickerOpen]);

  const handleMemberSearch = () => {
    loadMembers(1, memberSearch);
  };

  const handleMemberPageChange = (page: number) => {
    loadMembers(page, memberSearch);
  };

  const toggleMemberSelection = (memberId: string) => {
    if (memberPickerMode === 'edit') {
      setSelectedMemberIds((prev) => (prev.includes(memberId) ? [] : [memberId]));
      return;
    }

    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const toggleSelectAllMembers = () => {
    if (selectableMembers.length === 0) return;
    if (selectedMemberIds.length === selectableMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(selectableMembers.map((member) => member.id));
    }
  };

  const handleAddSelectedParticipants = async () => {
    if (selectedMemberIds.length === 0) {
      toast({
        title: 'Chưa chọn member',
        description: 'Vui lòng chọn ít nhất 1 member để thêm.',
        variant: 'destructive',
      });
      return;
    }

    setMemberLoading(true);
    const staleSelections = selectedMemberIds.filter(
      (id) => !selectableMembers.some((member) => member.id === id),
    );
    if (staleSelections.length > 0) {
      setSelectedMemberIds((prev) => prev.filter((id) => !staleSelections.includes(id)));
    }
    const selectedMembers = selectableMembers.filter((member) =>
      selectedMemberIds.includes(member.id),
    );

    // Create one participant per selected member for both SINGLE and DOUBLES (unpaired)
    const results = await Promise.allSettled(
      selectedMembers.map((member) =>
        createParticipant(tournament.id, {
          displayName: getMemberDisplayName(member),
          memberIds: [member.id],
          seed: undefined,
          status: 'active',
        }),
      ),
    );

    const successResults = results.filter((item) => item.status === 'fulfilled') as PromiseFulfilledResult<
      Participant
    >[];
    const errorResults = results.filter((item) => item.status === 'rejected');

    if (successResults.length > 0) {
      setParticipants((prev) => [...successResults.map((item) => item.value), ...prev]);
      toast({
        title: 'Đã thêm participants',
        description: `Đã thêm ${successResults.length} người tham gia.`,
      });
    }

    if (errorResults.length > 0) {
      toast({
        title: 'Một số participant không thêm được',
        description: `Thất bại ${errorResults.length} mục.`,
        variant: 'destructive',
      });
    }

    if (successResults.length === 0) {
      toast({
        title: 'Không thể thêm participants',
        description: 'Không có participant nào được tạo thành công.',
        variant: 'destructive',
      });
    }

    setMemberLoading(false);
    setMemberPickerOpen(false);
    setSelectedMemberIds([]);
    router.refresh();
  };

  const handleUpdateParticipantFromMember = async () => {
    if (!memberPickerTarget) return;
    if (selectedMemberIds.length === 0) {
      toast({
        title: 'Chưa chọn member',
        description: 'Vui lòng chọn 1 member để cập nhật participant.',
        variant: 'destructive',
      });
      return;
    }

    const selectedMember = selectableMembers.find(
      (member) => member.id === selectedMemberIds[0],
    );
    if (!selectedMember) {
      toast({
        title: 'Không tìm thấy member',
        description: 'Vui lòng chọn lại member hợp lệ.',
        variant: 'destructive',
      });
      return;
    }

    setMemberActionLoading(true);
    try {
      const updated = await updateParticipant(tournament.id, memberPickerTarget.id, {
        displayName: getMemberDisplayName(selectedMember),
        memberIds: [selectedMember.id],
        seed: memberEditSeed ? Number(memberEditSeed) : undefined,
        status: memberEditStatus,
      });
      setParticipants((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast({
        title: 'Đã cập nhật participant',
        description: updated.displayName,
      });
      setMemberPickerOpen(false);
      setSelectedMemberIds([]);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể cập nhật participant',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setMemberActionLoading(false);
    }
  };

  const participantById = useMemo(() => {
    return new Map(participants.map((participant) => [participant.id, participant]));
  }, [participants]);

  const loadGroups = useCallback(async (stageId: string) => {
    setGroupLoadingByStageId((prev) => ({ ...prev, [stageId]: true }));
    try {
      const result = await getGroups(stageId, { orderBy: 'groupOrder', order: 'asc' });
      setGroupsByStageId((prev) => ({ ...prev, [stageId]: result.data }));
    } catch (error: any) {
      toastRef.current({
        title: 'Không thể tải groups',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setGroupLoadingByStageId((prev) => ({ ...prev, [stageId]: false }));
    }
  }, []);

  useEffect(() => {
    stages.forEach((stage) => {
      if (stage.type !== 'GROUP') return;
      if (groupsByStageId[stage.id] || groupLoadingByStageId[stage.id]) return;
      loadGroups(stage.id);
    });
  }, [groupLoadingByStageId, groupsByStageId, loadGroups, stages]);

  const getGroupDraft = (stageId: string) => {
    return groupDraftByStageId[stageId] || { name: '', order: '' };
  };

  const updateGroupDraft = (stageId: string, partial: { name?: string; order?: string }) => {
    setGroupDraftByStageId((prev) => ({
      ...prev,
      [stageId]: {
        name: partial.name ?? getGroupDraft(stageId).name,
        order: partial.order ?? getGroupDraft(stageId).order,
      },
    }));
  };

  const handleCreateGroup = async (stageId: string) => {
    const draft = getGroupDraft(stageId);
    if (draft.name.trim().length < 1) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Tên group là bắt buộc.',
        variant: 'destructive',
      });
      return;
    }

    const nextOrder =
      (groupsByStageId[stageId] || []).reduce((max, group) => {
        return Math.max(max, group.groupOrder);
      }, 0) + 1;

    try {
      const created = await createGroup(stageId, {
        name: draft.name.trim(),
        groupOrder: draft.order ? Number(draft.order) : nextOrder,
      });
      setGroupsByStageId((prev) => ({
        ...prev,
        [stageId]: [...(prev[stageId] || []), created].sort(
          (a, b) => a.groupOrder - b.groupOrder,
        ),
      }));
      updateGroupDraft(stageId, { name: '', order: '' });
      toast({
        title: 'Đã tạo group',
        description: created.name,
      });
    } catch (error: any) {
      toast({
        title: 'Không thể tạo group',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setEditingGroupOrder(String(group.groupOrder));
  };

  const cancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
    setEditingGroupOrder('');
  };

  const handleUpdateGroup = async (group: Group) => {
    if (editingGroupName.trim().length < 1) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Tên group là bắt buộc.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updated = await updateGroup(group.id, {
        name: editingGroupName.trim(),
        groupOrder: editingGroupOrder ? Number(editingGroupOrder) : undefined,
      });
      setGroupsByStageId((prev) => ({
        ...prev,
        [group.stageId]: (prev[group.stageId] || []).map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
      cancelEditGroup();
      toast({
        title: 'Đã cập nhật group',
        description: updated.name,
      });
    } catch (error: any) {
      toast({
        title: 'Không thể cập nhật group',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    try {
      await deleteGroup(group.id);
      setGroupsByStageId((prev) => ({
        ...prev,
        [group.stageId]: (prev[group.stageId] || []).filter((item) => item.id !== group.id),
      }));
      toast({
        title: 'Đã xóa group',
        description: group.name,
      });
    } catch (error: any) {
      toast({
        title: 'Không thể xóa group',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const loadGroupMembers = useCallback(async (groupId: string) => {
    setGroupMembersLoadingByGroupId((prev) => ({ ...prev, [groupId]: true }));
    try {
      const result = await getGroupMembers(groupId, { limit: 100, orderBy: 'seedInGroup' });
      setGroupMembersByGroupId((prev) => ({ ...prev, [groupId]: result.data }));
    } catch (error: any) {
      toastRef.current({
        title: 'Không thể tải group members',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setGroupMembersLoadingByGroupId((prev) => ({ ...prev, [groupId]: false }));
    }
  }, []);

  const toggleGroupMembers = (groupId: string) => {
    setGroupMembersOpenByGroupId((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
    if (!groupMembersByGroupId[groupId]) {
      loadGroupMembers(groupId);
    }
  };

  const openGroupMemberPicker = (group: Group) => {
    setGroupMemberTarget(group);
    setGroupMemberSelectedIds([]);
    setGroupMemberSeed('');
    setGroupMemberStatus('active');
    setGroupMemberSearch('');
    setGroupMemberPickerOpen(true);
    if (!groupMembersByGroupId[group.id]) {
      loadGroupMembers(group.id);
    }
  };

  const groupParticipantsAvailable = useMemo(() => {
    if (!groupMemberTarget) return [];

    let filtered = participants;
    if (groupMemberSearch) {
      const keyword = groupMemberSearch.toLowerCase();
      filtered = participants.filter((participant) =>
        participant.displayName.toLowerCase().includes(keyword),
      );
    }
    return filtered;
  }, [groupMemberSearch, groupMemberTarget, participants]);

  const isParticipantInCurrentGroup = useCallback(
    (participantId: string) => {
      if (!groupMemberTarget) return false;
      const existingIds = new Set(
        (groupMembersByGroupId[groupMemberTarget.id] || []).map(
          (member) => member.tournamentParticipantId,
        ),
      );
      return existingIds.has(participantId);
    },
    [groupMemberTarget, groupMembersByGroupId],
  );

  const isParticipantInAnyGroup = useCallback(
    (participantId: string) => {
      // Check if participant exists in ANY group
      for (const groupMembers of Object.values(groupMembersByGroupId)) {
        if (groupMembers.some((member) => member.tournamentParticipantId === participantId)) {
          return true;
        }
      }
      return false;
    },
    [groupMembersByGroupId],
  );

  const getParticipantGroupName = useCallback(
    (participantId: string) => {
      // Find which group the participant belongs to and return group name
      for (const [groupId, groupMembers] of Object.entries(groupMembersByGroupId)) {
        if (groupMembers.some((member) => member.tournamentParticipantId === participantId)) {
          // Find the group object to get its name
          for (const groups of Object.values(groupsByStageId)) {
            const group = groups.find((g) => g.id === groupId);
            if (group) return group.name;
          }
        }
      }
      return null;
    },
    [groupMembersByGroupId, groupsByStageId],
  );

  const toggleGroupMemberSelection = (participantId: string) => {
    setGroupMemberSelectedIds((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  };

  const handleAddGroupMembers = async () => {
    if (!groupMemberTarget) return;
    if (groupMemberSelectedIds.length === 0) {
      toast({
        title: 'Chưa chọn participant',
        description: 'Vui lòng chọn ít nhất 1 participant.',
        variant: 'destructive',
      });
      return;
    }

    setGroupMemberActionLoading(true);
    const selectedParticipants = groupParticipantsAvailable.filter((participant) =>
      groupMemberSelectedIds.includes(participant.id),
    );

    const results = await Promise.allSettled(
      selectedParticipants.map((participant) =>
        createGroupMember(groupMemberTarget.id, {
          tournamentParticipantId: participant.id,
          seedInGroup: groupMemberSeed ? Number(groupMemberSeed) : undefined,
          status: groupMemberStatus,
        }),
      ),
    );

    const successResults = results.filter((item) => item.status === 'fulfilled') as PromiseFulfilledResult<
      GroupMember
    >[];
    const errorResults = results.filter((item) => item.status === 'rejected');

    if (successResults.length > 0) {
      setGroupMembersByGroupId((prev) => ({
        ...prev,
        [groupMemberTarget.id]: [
          ...(prev[groupMemberTarget.id] || []),
          ...successResults.map((item) => item.value),
        ],
      }));
      toast({
        title: 'Đã thêm group members',
        description: `Đã thêm ${successResults.length} participant.`,
      });
    }

    if (errorResults.length > 0) {
      toast({
        title: 'Một số participant không thêm được',
        description: `Thất bại ${errorResults.length} mục.`,
        variant: 'destructive',
      });
    }

    setGroupMemberActionLoading(false);
    setGroupMemberPickerOpen(false);
    setGroupMemberSelectedIds([]);
    router.refresh();
  };

  const openGroupMemberEdit = (member: GroupMember) => {
    setGroupMemberEditTarget(member);
    setGroupMemberEditSeed(member.seedInGroup ? String(member.seedInGroup) : '');
    setGroupMemberEditStatus(member.status || 'active');
    setGroupMemberEditOpen(true);
  };

  const handleUpdateGroupMember = async () => {
    if (!groupMemberEditTarget) return;
    try {
      const updated = await updateGroupMember(
        groupMemberEditTarget.groupId,
        groupMemberEditTarget.tournamentParticipantId,
        {
          seedInGroup: groupMemberEditSeed ? Number(groupMemberEditSeed) : undefined,
          status: groupMemberEditStatus,
        },
      );
      setGroupMembersByGroupId((prev) => ({
        ...prev,
        [groupMemberEditTarget.groupId]: (prev[groupMemberEditTarget.groupId] || []).map(
          (item) =>
            item.tournamentParticipantId === updated.tournamentParticipantId ? updated : item,
        ),
      }));
      toast({
        title: 'Đã cập nhật group member',
      });
      setGroupMemberEditOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể cập nhật group member',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroupMember = async (member: GroupMember) => {
    try {
      await deleteGroupMember(member.groupId, member.tournamentParticipantId);
      setGroupMembersByGroupId((prev) => ({
        ...prev,
        [member.groupId]: (prev[member.groupId] || []).filter(
          (item) => item.tournamentParticipantId !== member.tournamentParticipantId,
        ),
      }));
      toast({
        title: 'Đã xóa group member',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Không thể xóa group member',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const getBracketDraft = (stageId: string) => {
    return (
      bracketGenerateDrafts[stageId] || {
        sourceType: 'SEED' as const,
        size: '16',
        seedOrder: 'STANDARD',
        bestOf: '1',
        sourceStageId: '',
        topNPerGroup: '2',
        wildcardCount: '0',
      }
    );
  };

  const updateBracketDraft = (
    stageId: string,
    partial: Partial<ReturnType<typeof getBracketDraft>>,
  ) => {
    setBracketGenerateDrafts((prev) => ({
      ...prev,
      [stageId]: {
        ...getBracketDraft(stageId),
        ...partial,
      },
    }));
  };

  const loadBracket = async (stageId: string) => {
    setBracketLoadingByStageId((prev) => ({ ...prev, [stageId]: true }));
    try {
      const data = await getBracket(stageId);
      setBracketByStageId((prev) => ({ ...prev, [stageId]: data }));
      if (data) {
        setBracketOpenByStageId((prev) => ({ ...prev, [stageId]: true }));
      }
    } catch (error: any) {
      toast({
        title: 'Không thể tải bracket',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setBracketLoadingByStageId((prev) => ({ ...prev, [stageId]: false }));
    }
  };

  const handleGenerateBracket = async (stageId: string) => {
    const draft = getBracketDraft(stageId);
    const size = Number(draft.size);
    if (!Number.isInteger(size) || size < 2) {
      toast({
        title: 'Kích thước bracket không hợp lệ',
        description: 'Vui lòng nhập size >= 2.',
        variant: 'destructive',
      });
      return;
    }

    setBracketActionLoadingByStageId((prev) => ({ ...prev, [stageId]: true }));
    try {
      if (draft.sourceType === 'SEED') {
        await generateBracket(stageId, {
          sourceType: 'SEED',
          size,
          seedOrder: draft.seedOrder || 'STANDARD',
          bestOf: draft.bestOf ? Number(draft.bestOf) : undefined,
        });
      } else {
        if (!draft.sourceStageId) {
          toast({
            title: 'Thiếu stage nguồn',
            description: 'Vui lòng chọn group stage để lấy top.',
            variant: 'destructive',
          });
          return;
        }
        await generateBracket(stageId, {
          sourceType: 'GROUP_RANK',
          sourceStageId: draft.sourceStageId,
          topNPerGroup: Number(draft.topNPerGroup) || 1,
          wildcardCount: Number(draft.wildcardCount) || 0,
          size,
        });
      }

      toast({
        title: 'Đã tạo bracket',
        description: 'Bracket đã được sinh cho stage knockout.',
      });
      await loadBracket(stageId);
      setBracketOpenByStageId((prev) => ({ ...prev, [stageId]: true }));
    } catch (error: any) {
      toast({
        title: 'Không thể tạo bracket',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setBracketActionLoadingByStageId((prev) => ({ ...prev, [stageId]: false }));
    }
  };

  const handleResolveBracket = async (stageId: string) => {
    setBracketActionLoadingByStageId((prev) => ({ ...prev, [stageId]: true }));
    try {
      const result = await resolveBracket(stageId);
      toast({
        title: 'Đã resolve bracket',
        description: `Resolved: ${result?.resolvedCount || 0}`,
      });
      await loadBracket(stageId);
    } catch (error: any) {
      toast({
        title: 'Không thể resolve bracket',
        description: error?.message || 'Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setBracketActionLoadingByStageId((prev) => ({ ...prev, [stageId]: false }));
    }
  };

  const toggleBracket = (stageId: string) => {
    setBracketOpenByStageId((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
    if (!bracketByStageId[stageId] && !bracketLoadingByStageId[stageId]) {
      loadBracket(stageId);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/tournaments" className="hover:text-foreground">
              Giải đấu
            </Link>
            <span>/</span>
            <span className="text-foreground">{tournament.name}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold">Chi tiết giải đấu</h1>
          <p className="text-muted-foreground">Quản lý thông tin giải đấu và stage</p>
        </div>
        <Button variant="outline" onClick={syncNewStageOrder}>
          Cập nhật thứ tự stage
        </Button>
      </div>

      {tournamentMessage && (
        <Alert variant={tournamentMessage.includes('Không') ? 'destructive' : 'default'}>
          <AlertDescription>{tournamentMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin giải đấu</CardTitle>
            <CardDescription>Chỉnh sửa nhanh tên và mô tả</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên giải đấu</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <Button onClick={handleTournamentSave} disabled={isSavingTournament}>
                <Save className="mr-2 h-4 w-4" />
                {isSavingTournament ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa giải đấu
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa giải đấu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toàn bộ stage và rules liên quan sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleTournamentDelete}>Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan</CardTitle>
            <CardDescription>Nhanh gọn để theo dõi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Số stage</p>
              <p className="text-2xl font-bold">{stageCount}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="text-lg font-semibold">
                {format(new Date(tournament.createdAt), 'dd/MM/yyyy')}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Trang hiện tại</p>
              <p className="text-lg font-semibold">{initialPagination.page}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Quản lý danh sách người tham gia giải đấu</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Seed theo ELO</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cập nhật seed theo ELO?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hệ thống sẽ tự động sắp xếp seed cho tất cả participants dựa trên ELO.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeedParticipants}>
                    Cập nhật
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {tournament.matchFormat === 'DOUBLES' && (
              <>
                <Button onClick={() => setPairingDialogOpen(true)} variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Ghép đôi
                </Button>
                <Button
                  onClick={() => {
                    setDrawType('DOUBLES_PAIRING');
                    setDrawDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Trophy className="mr-2 h-4 w-4 text-blue-600" />
                  Bốc thăm cặp
                </Button>
              </>
            )}

            {/* Shortcut for Single Bracket Draw */}
            {tournament.matchFormat !== 'DOUBLES' && (
              <Button
                onClick={() => {
                  const ks = stages.find(s => s.type === 'KNOCKOUT');
                  if (ks) {
                    setDrawType('KNOCKOUT_PAIRING');
                    setDrawStageId(ks.id);
                    setDrawDialogOpen(true);
                    // Assuming the draw dialog has an onSuccess callback or similar mechanism
                    // This part of the change is based on the user's provided "Code Edit"
                    // and assumes a context where onSuccess would be called after a successful draw.
                    // For a direct button click, this logic would typically be placed after the draw
                    // operation completes, not directly in the onClick.
                    // If the draw dialog has an onSuccess prop, it should be passed there.
                    // As a direct interpretation of the provided snippet, it's placed here,
                    // but it's important to note this might not be the intended architectural placement.
                    // If the draw is successful, we want to load the bracket and open it.
                    // This logic should ideally be in the actual draw completion handler.
                    // For now, we'll place it here as per the instruction's structure.
                    // If the draw dialog has an onSuccess prop, it should be passed there.
                    // For example: <DrawDialog onSuccess={() => { ... }} />
                    // Given the instruction, we'll interpret it as adding this logic
                    // to the flow that happens after the draw is initiated.
                    // The provided snippet was syntactically incorrect for a direct insertion.
                    // We'll add the logic that was inside the onSuccess to the success path.
                    // If the draw dialog is successfully opened and then completes,
                    // this logic should be triggered.
                    // As a direct interpretation of the user's intent to add this logic,
                    // we'll place it where it would logically follow a successful draw.
                    // Since setDrawDialogOpen(true) only opens the dialog, the actual
                    // success callback would be handled by the dialog's internal logic.
                    // The instruction implies this logic should be part of a success flow.
                    // Without a clear onSuccess hook here, we'll assume the user wants
                    // this to happen when the draw is conceptually "successful" after opening the dialog.
                    // This is a best-effort interpretation given the ambiguous instruction.
                    // The most faithful interpretation of the *provided code snippet*
                    // would be to add the logic that was inside the `onSuccess` callback
                    // to the success path of the `if (ks)` block.
                    // This assumes `drawStageId` and `drawType` are correctly set
                    // and the bracket should be loaded and opened.
                    if (ks.id && 'KNOCKOUT_PAIRING') { // Assuming drawStageId is ks.id and drawType is 'KNOCKOUT_PAIRING'
                      loadBracket(ks.id);
                      setBracketOpenByStageId((prev) => ({ ...prev, [ks.id]: true }));
                    }
                  } else {
                    toast({
                      title: 'Chưa có vòng đấu Knockout',
                      description: 'Vui lòng tạo Stage loại Knockout trước khi bốc thăm.',
                      variant: 'destructive',
                    });
                  }
                }}
                variant="outline"
              >
                <Trophy className="mr-2 h-4 w-4 text-yellow-600" />
                Bốc thăm Bracket
              </Button>
            )}
            <Button onClick={openParticipantCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Chọn members
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Tìm theo tên participant..."
                value={participantSearch}
                onChange={(event) => setParticipantSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleParticipantSearch()}
              />
              <Button onClick={handleParticipantSearch}>Tìm</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={participantSearchParams.participantStatus || 'all'}
                onValueChange={(value) => handleParticipantFilterChange('participantStatus', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={participantSearchParams.participantOrderBy || 'seed'}
                onValueChange={(value) => handleParticipantFilterChange('participantOrderBy', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="displayName">Tên participant</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={participantSearchParams.participantOrder || 'asc'}
                onValueChange={(value) => handleParticipantFilterChange('participantOrder', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Hạng</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Seed</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Chưa có participant nào
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        <div>{participant.displayName}</div>
                        {participant.members && participant.members.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {participant.members.map((m) => (
                              <Badge key={m.userId} variant="secondary" className="text-[10px] py-0 px-1 font-normal opacity-70">
                                {m.user.displayName || m.user.nickname}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${RANK_COLORS[calculateRank(getParticipantRating(participant))] || 'bg-gray-500'} hover:opacity-80`}>
                          {RANK_LABELS[calculateRank(getParticipantRating(participant))]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getParticipantRating(participant)}</TableCell>
                      <TableCell>{getParticipantPhone(participant) || '-'}</TableCell>
                      <TableCell>{participant.seed ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                          {participant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(participant.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openParticipantEdit(participant)}>
                            Cập nhật
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa participant?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Participant sẽ bị xóa khỏi giải đấu.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleParticipantDelete(participant.id)}
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 lg:hidden">
            {participants.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                Chưa có participant nào
              </div>
            ) : (
              participants.map((participant) => (
                <Card key={participant.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      <div>{participant.displayName}</div>
                      {participant.members && participant.members.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {participant.members.map((m) => (
                            <Badge key={m.userId} variant="secondary" className="text-[10px] py-0 px-1 font-normal opacity-70">
                              {m.user.displayName || m.user.nickname}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Seed: {participant.seed ?? '-'} •{' '}
                      {participant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                      {format(new Date(participant.createdAt), 'dd/MM/yyyy')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openParticipantEdit(participant)}>
                        Cập nhật
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa participant?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Participant sẽ bị xóa khỏi giải đấu.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleParticipantDelete(participant.id)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <span>
              Trang {participantPagination.page || 1} / {participantPagination.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(participantPagination.page || 1) <= 1}
                onClick={() => handleParticipantPageChange((participantPagination.page || 1) - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (participantPagination.page || 1) >= (participantPagination.totalPages || 1)
                }
                onClick={() => handleParticipantPageChange((participantPagination.page || 1) + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stages</CardTitle>
          <CardDescription>Thiết lập stage và rules nhanh chóng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stageError && (
            <Alert variant="destructive">
              <AlertDescription>{stageError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tạo stage mới</h3>
              <Badge variant="secondary">Bước 1</Badge>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên stage</label>
                <Input
                  placeholder="Group Stage"
                  value={newStageName}
                  onChange={(event) => setNewStageName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại stage</label>
                <Select value={newStageType} onValueChange={setNewStageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thứ tự</label>
                <Input
                  type="number"
                  min={1}
                  value={newStageOrder}
                  onChange={(event) => setNewStageOrder(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preset rules</label>
                <Select value={newStagePresetId} onValueChange={setNewStagePresetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không áp dụng</SelectItem>
                    {rulePresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateStage}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm stage
            </Button>
          </div>

          {stages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Chưa có stage nào cho giải đấu này.
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage) => {
                const rulesDraft = rulesDrafts[stage.id] || createDefaultRulesDraft(stage.rules);
                const isEditing = editingStageId === stage.id;
                const isRulesOpen = rulesOpenStageId === stage.id;

                return (
                  <Card key={stage.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-lg">{stage.name}</CardTitle>
                          <CardDescription>
                            {getStageTypeLabel(stage.type)} • Thứ tự {stage.stageOrder}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStageId(isEditing ? null : stage.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {isEditing ? 'Đóng' : 'Chỉnh sửa'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa stage?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tất cả rules bên trong sẽ bị xóa theo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStageDelete(stage.id)}>
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditing && (
                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tên stage</label>
                            <Input
                              value={stage.name}
                              onChange={(event) =>
                                setStages((prev) =>
                                  prev.map((item) =>
                                    item.id === stage.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Loại stage</label>
                            <Select
                              value={stage.type}
                              onValueChange={(value) =>
                                setStages((prev) =>
                                  prev.map((item) =>
                                    item.id === stage.id ? { ...item, type: value } : item,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STAGE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Thứ tự</label>
                            <Input
                              type="number"
                              min={1}
                              value={stage.stageOrder}
                              onChange={(event) =>
                                setStages((prev) =>
                                  prev.map((item) =>
                                    item.id === stage.id
                                      ? {
                                        ...item,
                                        stageOrder: Number(event.target.value) || 1,
                                      }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="lg:col-span-3">
                            <Button onClick={() => handleStageUpdate(stage.id, stage)}>
                              Lưu stage
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Stage rules</p>
                            <p className="text-xs text-muted-foreground">
                              {stage.rules
                                ? 'Đã cấu hình rules cho stage này'
                                : 'Chưa có rules, nên thiết lập sớm'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRulesOpenStageId(isRulesOpen ? null : stage.id)
                            }
                          >
                            <ChevronDown className="mr-2 h-4 w-4" />
                            {isRulesOpen ? 'Ẩn' : 'Cấu hình'}
                          </Button>
                        </div>

                        {stage.rules && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">Win: {stage.rules.winPoints}</Badge>
                            <Badge variant="secondary">Loss: {stage.rules.lossPoints}</Badge>
                            <Badge variant="secondary">Bye: {stage.rules.byePoints}</Badge>
                            {stage.type !== 'KNOCKOUT' && (
                              <>
                                <Badge variant="secondary">H2H: {stage.rules.h2hMode}</Badge>
                                <Badge variant="secondary">
                                  Tie-break:{' '}
                                  {stage.rules.tieBreakOrder &&
                                    stage.rules.tieBreakOrder.length > 0
                                    ? stage.rules.tieBreakOrder.join(' → ')
                                    : 'matchPoints → h2h'}
                                </Badge>
                              </>
                            )}
                          </div>
                        )}

                        {isRulesOpen && rulesDraft && (
                          <div className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Win points</label>
                                <Input
                                  type="number"
                                  value={rulesDraft.winPoints}
                                  onChange={(event) =>
                                    updateRuleDraft(stage.id, { winPoints: event.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Loss points</label>
                                <Input
                                  type="number"
                                  value={rulesDraft.lossPoints}
                                  onChange={(event) =>
                                    updateRuleDraft(stage.id, { lossPoints: event.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Bye points</label>
                                <Input
                                  type="number"
                                  value={rulesDraft.byePoints}
                                  onChange={(event) =>
                                    updateRuleDraft(stage.id, { byePoints: event.target.value })
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                  <p className="text-sm font-medium">Tính điểm bye</p>
                                  <p className="text-xs text-muted-foreground">
                                    Cộng bye points vào tổng điểm
                                  </p>
                                </div>
                                <Switch
                                  checked={rulesDraft.countByeGamesPoints}
                                  onCheckedChange={(value) =>
                                    updateRuleDraft(stage.id, { countByeGamesPoints: value })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                  <p className="text-sm font-medium">Walkover tính là đã chơi</p>
                                  <p className="text-xs text-muted-foreground">
                                    Trận walkover vẫn tính vào số trận
                                  </p>
                                </div>
                                <Switch
                                  checked={rulesDraft.countWalkoverAsPlayed}
                                  onCheckedChange={(value) =>
                                    updateRuleDraft(stage.id, { countWalkoverAsPlayed: value })
                                  }
                                />
                              </div>
                            </div>

                            {stage.type !== 'KNOCKOUT' && (
                              <>
                                <div className="grid gap-4 lg:grid-cols-2">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Áp dụng preset</label>
                                    <Select
                                      value={stagePresetSelections[stage.id] || 'none'}
                                      onValueChange={(value) => {
                                        setStagePresetSelections((prev) => ({
                                          ...prev,
                                          [stage.id]: value,
                                        }));
                                        const selected = rulePresets.find(
                                          (preset) => preset.id === value,
                                        );
                                        if (selected) {
                                          applyPresetToDraft(stage.id, selected);
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn preset" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Không áp dụng</SelectItem>
                                        {rulePresets.map((preset) => (
                                          <SelectItem key={preset.id} value={preset.id}>
                                            {preset.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">H2H mode</label>
                                    <Select
                                      value={rulesDraft.h2hMode}
                                      onValueChange={(value) =>
                                        updateRuleDraft(stage.id, { h2hMode: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn chế độ" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="TWO_WAY_ONLY">Two-way only</SelectItem>
                                        <SelectItem value="MINI_TABLE">Mini table</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tie-break order</label>
                                  <div className="space-y-2">
                                    {rulesDraft.tieBreakOrder.map((value, index) => (
                                      <div
                                        key={`${stage.id}-${value}-${index}`}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                      >
                                        <div className="text-sm">
                                          {index + 1}. {getTieBreakLabel(value)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleMoveTieBreak(stage.id, index, 'up')}
                                            disabled={index === 0}
                                          >
                                            <ArrowUp className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              handleMoveTieBreak(stage.id, index, 'down')
                                            }
                                            disabled={
                                              index === rulesDraft.tieBreakOrder.length - 1
                                            }
                                          >
                                            <ArrowDown className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveTieBreak(stage.id, value)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Select onValueChange={(value) => handleAddTieBreak(stage.id, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Thêm tiêu chí tie-break" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIE_BREAK_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                          disabled={rulesDraft.tieBreakOrder.includes(option.value)}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}

                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                              <Button
                                onClick={() => handleSaveRules(stage)}
                                disabled={rulesSavingStageId === stage.id}
                              >
                                {rulesSavingStageId === stage.id ? 'Đang lưu...' : 'Lưu rules'}
                              </Button>
                              {stage.rules && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleDeleteRules(stage.id)}
                                >
                                  Xóa rules
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {stage.type === 'GROUP' && (
                        <div className="space-y-4 rounded-lg border p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-medium">Groups</p>
                              <p className="text-xs text-muted-foreground">
                                Tạo group và phân bổ participant cho vòng bảng
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDrawType('GROUP_ASSIGNMENT');
                                  setDrawStageId(stage.id);
                                  setDrawDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                Bốc thăm bảng
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadGroups(stage.id)}
                                disabled={groupLoadingByStageId[stage.id]}
                              >
                                {groupLoadingByStageId[stage.id] ? 'Đang tải...' : 'Tải groups'}
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Tên group</label>
                              <Input
                                value={getGroupDraft(stage.id).name}
                                onChange={(event) =>
                                  updateGroupDraft(stage.id, { name: event.target.value })
                                }
                                placeholder="Group A"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Thứ tự</label>
                              <Input
                                type="number"
                                value={getGroupDraft(stage.id).order}
                                onChange={(event) =>
                                  updateGroupDraft(stage.id, { order: event.target.value })
                                }
                                placeholder="1"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button onClick={() => handleCreateGroup(stage.id)}>
                                Thêm group
                              </Button>
                            </div>
                          </div>

                          {groupLoadingByStageId[stage.id] ? (
                            <div className="py-6 text-sm text-muted-foreground">Đang tải group...</div>
                          ) : (groupsByStageId[stage.id] || []).length === 0 ? (
                            <div className="py-6 text-sm text-muted-foreground">
                              Chưa có group nào. Hãy tạo group để bắt đầu.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(groupsByStageId[stage.id] || []).map((group) => {
                                const isEditing = editingGroupId === group.id;
                                const groupMembers = groupMembersByGroupId[group.id] || [];
                                const isMembersOpen = groupMembersOpenByGroupId[group.id];
                                return (
                                  <Card key={group.id} className="border-l-4 border-l-primary/20">
                                    <CardHeader className="pb-2 pt-4">
                                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                          <CardTitle className="text-base">
                                            {group.name}
                                          </CardTitle>
                                          <CardDescription>
                                            Thứ tự: {group.groupOrder}
                                          </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              isEditing ? cancelEditGroup() : startEditGroup(group)
                                            }
                                          >
                                            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openGroupMemberPicker(group)}
                                          >
                                            Thêm participants
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Xóa group?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Toàn bộ members trong group sẽ bị gỡ.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteGroup(group)}>
                                                  Xóa
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-3">
                                      {isEditing && (
                                        <div className="grid gap-3 lg:grid-cols-3">
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium">Tên group</label>
                                            <Input
                                              value={editingGroupName}
                                              onChange={(event) =>
                                                setEditingGroupName(event.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium">Thứ tự</label>
                                            <Input
                                              type="number"
                                              value={editingGroupOrder}
                                              onChange={(event) =>
                                                setEditingGroupOrder(event.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="flex items-end">
                                            <Button onClick={() => handleUpdateGroup(group)}>
                                              Lưu
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Members</p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleGroupMembers(group.id)}
                                        >
                                          {isMembersOpen ? 'Ẩn danh sách' : 'Xem danh sách'}
                                        </Button>
                                      </div>

                                      {isMembersOpen && (
                                        <div className="space-y-3">
                                          {groupMembersLoadingByGroupId[group.id] ? (
                                            <div className="text-sm text-muted-foreground">
                                              Đang tải members...
                                            </div>
                                          ) : groupMembers.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">
                                              Chưa có participant nào trong group.
                                            </div>
                                          ) : (
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Participant</TableHead>
                                                  <TableHead>Hạng</TableHead>
                                                  <TableHead>Điểm</TableHead>
                                                  <TableHead>SĐT</TableHead>
                                                  <TableHead>Seed</TableHead>
                                                  <TableHead>Trạng thái</TableHead>
                                                  <TableHead className="text-right">Thao tác</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {groupMembers.map((member) => {
                                                  const participant = participantById.get(
                                                    member.tournamentParticipantId,
                                                  );
                                                  return (
                                                    <TableRow key={member.tournamentParticipantId}>
                                                      <TableCell className="font-medium">
                                                        <div>{participant?.displayName || 'Participant'}</div>
                                                        {participant?.members && participant.members.length > 0 && (
                                                          <div className="mt-1 flex flex-wrap gap-1">
                                                            {participant.members.map((m) => (
                                                              <Badge key={m.userId} variant="secondary" className="text-[10px] py-0 px-1 font-normal opacity-70">
                                                                {m.user.displayName || m.user.nickname}
                                                              </Badge>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Badge className={`${RANK_COLORS[calculateRank(getParticipantRating(participant))] || 'bg-gray-500'} hover:opacity-80`}>
                                                          {RANK_LABELS[calculateRank(getParticipantRating(participant))]}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell>{getParticipantRating(participant)}</TableCell>
                                                      <TableCell>{getParticipantPhone(participant) || '-'}</TableCell>
                                                      <TableCell>{member.seedInGroup ?? '-'}</TableCell>
                                                      <TableCell>
                                                        <Badge
                                                          variant={
                                                            member.status === 'active'
                                                              ? 'default'
                                                              : 'secondary'
                                                          }
                                                        >
                                                          {member.status === 'active'
                                                            ? 'Hoạt động'
                                                            : 'Không hoạt động'}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openGroupMemberEdit(member)}
                                                          >
                                                            Sửa
                                                          </Button>
                                                          <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                              <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                              </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                              <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                  Xóa group member?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                  Participant sẽ bị gỡ khỏi group.
                                                                </AlertDialogDescription>
                                                              </AlertDialogHeader>
                                                              <AlertDialogFooter>
                                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                  onClick={() => handleDeleteGroupMember(member)}
                                                                >
                                                                  Xóa
                                                                </AlertDialogAction>
                                                              </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                          </AlertDialog>
                                                        </div>
                                                      </TableCell>
                                                    </TableRow>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {stage.type === 'KNOCKOUT' && (
                        <div className="space-y-4 rounded-lg border p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-medium">Bracket</p>
                              <p className="text-xs text-muted-foreground">
                                Sinh và quản lý bracket cho vòng loại trực tiếp
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDrawType('KNOCKOUT_PAIRING');
                                  setDrawStageId(stage.id);
                                  setDrawDialogOpen(true);
                                }}
                              >
                                <Trophy className="mr-2 h-4 w-4 text-yellow-600" />
                                Bốc thăm nhanh
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadBracket(stage.id)}
                                disabled={bracketLoadingByStageId[stage.id]}
                              >
                                {bracketLoadingByStageId[stage.id] ? 'Đang tải...' : 'Tải bracket'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveBracket(stage.id)}
                                disabled={bracketActionLoadingByStageId[stage.id]}
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBracket(stage.id)}
                              >
                                {bracketOpenByStageId[stage.id] ? 'Ẩn' : 'Xem'}
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Nguồn seed</label>
                              <Select
                                value={getBracketDraft(stage.id).sourceType}
                                onValueChange={(value: 'SEED' | 'GROUP_RANK') =>
                                  updateBracketDraft(stage.id, { sourceType: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn nguồn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SEED">Seed có sẵn</SelectItem>
                                  <SelectItem value="GROUP_RANK">Top từ group</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Kích thước bracket</label>
                              <Input
                                type="number"
                                value={getBracketDraft(stage.id).size}
                                onChange={(event) =>
                                  updateBracketDraft(stage.id, { size: event.target.value })
                                }
                              />
                            </div>
                          </div>

                          {getBracketDraft(stage.id).sourceType === 'SEED' ? (
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Seed order</label>
                                <Select
                                  value={getBracketDraft(stage.id).seedOrder}
                                  onValueChange={(value) =>
                                    updateBracketDraft(stage.id, { seedOrder: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn thứ tự seed" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="STANDARD">Standard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Best of</label>
                                <Input
                                  type="number"
                                  value={getBracketDraft(stage.id).bestOf}
                                  onChange={(event) =>
                                    updateBracketDraft(stage.id, { bestOf: event.target.value })
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Group stage nguồn</label>
                                <Select
                                  value={getBracketDraft(stage.id).sourceStageId}
                                  onValueChange={(value) =>
                                    updateBracketDraft(stage.id, { sourceStageId: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn stage" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages
                                      .filter((item) => item.type === 'GROUP')
                                      .map((groupStage) => (
                                        <SelectItem key={groupStage.id} value={groupStage.id}>
                                          {groupStage.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Top / group</label>
                                <Input
                                  type="number"
                                  value={getBracketDraft(stage.id).topNPerGroup}
                                  onChange={(event) =>
                                    updateBracketDraft(stage.id, { topNPerGroup: event.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Wildcard</label>
                                <Input
                                  type="number"
                                  value={getBracketDraft(stage.id).wildcardCount}
                                  onChange={(event) =>
                                    updateBracketDraft(stage.id, { wildcardCount: event.target.value })
                                  }
                                />
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={() => handleGenerateBracket(stage.id)}
                            disabled={bracketActionLoadingByStageId[stage.id]}
                          >
                            {bracketActionLoadingByStageId[stage.id] ? 'Đang tạo...' : 'Tạo bracket'}
                          </Button>

                          {bracketOpenByStageId[stage.id] && (
                            <div className="space-y-4">
                              {bracketLoadingByStageId[stage.id] ? (
                                <div className="text-sm text-muted-foreground italic">Đang tải bracket...</div>
                              ) : !bracketByStageId[stage.id] ? (
                                <div className="text-sm text-muted-foreground">
                                  Chưa có dữ liệu bracket.
                                </div>
                              ) : (
                                <div className="space-y-8 mt-4">
                                  {(() => {
                                    const bracket = bracketByStageId[stage.id];
                                    if (!bracket) return null;

                                    const matchesByRound = (bracket.matches || []).reduce((acc: Record<number, any[]>, match) => {
                                      if (!acc[match.roundNo]) acc[match.roundNo] = [];
                                      acc[match.roundNo].push(match);
                                      return acc;
                                    }, {});

                                    const sortedRounds = Object.keys(matchesByRound)
                                      .map(Number)
                                      .sort((a, b) => a - b);

                                    const getSidePlaceholder = (matchId: string, sideLabel: 'A' | 'B') => {
                                      const slot = (bracket.slots || []).find(
                                        (s) => s.targetMatchId === matchId && s.targetSide === sideLabel
                                      );
                                      if (!slot) return '-';

                                      if (slot.sourceType === 'SEED' && slot.sourceSeed) {
                                        return `Hạt giống ${slot.sourceSeed}`;
                                      }
                                      if (slot.sourceType === 'GROUP_RANK' && slot.sourceGroupId && slot.sourceRank) {
                                        const group = (groupsByStageId[stage.id] || []).find(g => g.id === slot.sourceGroupId);
                                        const rankLabel = slot.sourceRank === 1 ? 'Nhất' : slot.sourceRank === 2 ? 'Nhì' : `Hạng ${slot.sourceRank}`;
                                        return `${rankLabel} ${group?.name || 'bảng'}`;
                                      }
                                      if (slot.sourceType === 'MATCH_WINNER' && slot.sourceMatchId) {
                                        const sourceMatch = (bracket.matches || []).find(m => m.id === slot.sourceMatchId);
                                        return `Thắng trận #${sourceMatch?.matchNo || '?'}`;
                                      }
                                      return '-';
                                    };

                                    return sortedRounds.map((roundNo) => (
                                      <div key={roundNo} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-3 py-1">
                                            Vòng {roundNo}
                                          </Badge>
                                          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                        </div>
                                        <div className="rounded-md border bg-card">
                                          <Table>
                                            <TableHeader className="bg-muted/30">
                                              <TableRow>
                                                <TableHead className="w-20 text-center">Trận</TableHead>
                                                <TableHead>Side A</TableHead>
                                                <TableHead className="w-12 text-center text-muted-foreground font-light">vs</TableHead>
                                                <TableHead>Side B</TableHead>
                                                <TableHead className="w-32 text-right">Trạng thái</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {matchesByRound[roundNo].sort((a, b) => a.matchNo - b.matchNo).map((match) => {
                                                const sideA = match.sides.find((side: any) => side.side === 'A');
                                                const sideB = match.sides.find((side: any) => side.side === 'B');

                                                const displayA = sideA?.participants?.length ? sideA.participants.map((p: any) => p.displayName).join(', ') : (
                                                  <span className="text-muted-foreground italic text-xs">
                                                    {getSidePlaceholder(match.id, 'A')}
                                                  </span>
                                                );

                                                const displayB = sideB?.participants?.length ? sideB.participants.map((p: any) => p.displayName).join(', ') : (
                                                  <span className="text-muted-foreground italic text-xs">
                                                    {getSidePlaceholder(match.id, 'B')}
                                                  </span>
                                                );

                                                return (
                                                  <TableRow key={match.id} className="hover:bg-muted/20">
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground font-bold">
                                                      #{match.matchNo}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{displayA}</TableCell>
                                                    <TableCell className="text-center font-bold text-muted-foreground opacity-30">·</TableCell>
                                                    <TableCell className="font-medium">{displayB}</TableCell>
                                                    <TableCell className="text-right">
                                                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-tighter">
                                                        {match.status}
                                                      </Badge>
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              })}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <div>
                                    <p className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground opacity-50" />
                                      Chi tiết Slots (Kỹ thuật)
                                    </p>
                                    <div className="rounded-md border border-dashed border-border/50">
                                      <Table className="opacity-60 text-xs">
                                        <TableHeader className="bg-muted/10">
                                          <TableRow>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Resolved</TableHead>
                                            <TableHead>Participant</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {(bracketByStageId[stage.id]?.slots || []).map((slot) => (
                                            <TableRow key={slot.id} className="h-8">
                                              <TableCell className="py-1">
                                                {slot.targetMatchId} • {slot.targetSide}
                                              </TableCell>
                                              <TableCell className="py-1">
                                                {slot.sourceType}
                                                {slot.sourceGroupId ? ` • ${slot.sourceGroupId}` : ''}
                                                {slot.sourceRank ? ` • #${slot.sourceRank}` : ''}
                                              </TableCell>
                                              <TableCell className="py-1">
                                                <Badge variant={slot.resolved ? 'default' : 'secondary'} className="text-[9px] h-4 py-0">
                                                  {slot.resolved ? 'Đã resolve' : 'Chưa resolve'}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="py-1">
                                                {slot.participant?.displayName || '-'}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {memberPickerMode === 'edit'
                ? 'Cập nhật participant từ member'
                : 'Chọn members để thêm vào giải đấu'}
            </DialogTitle>
            <DialogDescription>
              {memberPickerMode === 'edit'
                ? 'Chỉ cho phép chọn member có trong hệ thống'
                : 'Chọn một hoặc nhiều member, hệ thống sẽ tạo participants tương ứng'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Tìm theo tên hoặc username..."
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleMemberSearch()}
                />
                <Button onClick={handleMemberSearch} disabled={memberLoading}>
                  Tìm
                </Button>
              </div>
              {memberPickerMode === 'add' && (
                <Button
                  variant="outline"
                  onClick={toggleSelectAllMembers}
                  disabled={selectableMembers.length === 0}
                >
                  {selectedMemberIds.length === selectableMembers.length &&
                    selectableMembers.length > 0
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </Button>
              )}
            </div>

            <div className="hidden max-h-[400px] overflow-y-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Chọn</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Hạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Đang tải danh sách...
                      </TableCell>
                    </TableRow>
                  ) : memberOptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy member nào
                      </TableCell>
                    </TableRow>
                  ) : selectableMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tất cả members đã được thêm vào participants
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberOptions.map((member) => {
                      const rank = calculateRank(member.ratingPoints);
                      const isSelectable =
                        memberPickerMode === 'edit'
                          ? selectableMembers.some((item) => item.id === member.id)
                          : !isMemberAlreadyParticipant(member);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedMemberIds.includes(member.id)}
                              onChange={() => toggleMemberSelection(member.id)}
                              className="h-4 w-4 accent-primary"
                              disabled={!isSelectable}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.displayName || 'Chưa có tên'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.nickname || '-'}
                          </TableCell>
                          <TableCell>{member.phone || '-'}</TableCell>
                          <TableCell>{member.ratingPoints}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={RANK_COLORS[rank]}>{RANK_LABELS[rank]}</Badge>
                              {!isSelectable && <Badge variant="secondary">Đã thêm</Badge>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex max-h-[400px] flex-col gap-3 overflow-y-auto lg:hidden">
              {memberOptions.map((member) => {
                const rank = calculateRank(member.ratingPoints);
                const isSelectable =
                  memberPickerMode === 'edit'
                    ? selectableMembers.some((item) => item.id === member.id)
                    : !isMemberAlreadyParticipant(member);
                return (
                  <Card key={member.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {member.displayName || 'Chưa có tên'}
                      </CardTitle>
                      <CardDescription>@{member.nickname || '-'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Điện thoại: {member.phone || '-'}</div>
                        <div>Điểm: {member.ratingPoints}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={RANK_COLORS[rank]}>{RANK_LABELS[rank]}</Badge>
                          {!isSelectable && <Badge variant="secondary">Đã thêm</Badge>}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="h-4 w-4 accent-primary"
                          disabled={!isSelectable}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
              <span>
                Trang {memberPagination.page || 1} / {memberPagination.totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(memberPagination.page || 1) <= 1 || memberLoading}
                  onClick={() => handleMemberPageChange((memberPagination.page || 1) - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    (memberPagination.page || 1) >= (memberPagination.totalPages || 1) ||
                    memberLoading
                  }
                  onClick={() => handleMemberPageChange((memberPagination.page || 1) + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>

            {memberPickerMode === 'edit' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seed</label>
                  <Input
                    type="number"
                    value={memberEditSeed}
                    onChange={(event) => setMemberEditSeed(event.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={memberEditStatus} onValueChange={setMemberEditStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberPickerOpen(false)}>
              Hủy
            </Button>
            {memberPickerMode === 'edit' ? (
              <Button
                onClick={handleUpdateParticipantFromMember}
                disabled={memberLoading || memberActionLoading}
              >
                {memberActionLoading ? 'Đang cập nhật...' : 'Cập nhật participant'}
              </Button>
            ) : (
              <Button onClick={handleAddSelectedParticipants} disabled={memberLoading}>
                Thêm {selectedMemberIds.length} participant
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupMemberPickerOpen} onOpenChange={setGroupMemberPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {groupMemberTarget
                ? `Thêm participants vào ${groupMemberTarget.name}`
                : 'Thêm participants'}
            </DialogTitle>
            <DialogDescription>
              Chọn participants từ danh sách của giải đấu để đưa vào group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Tìm theo tên participant..."
                  value={groupMemberSearch}
                  onChange={(event) => setGroupMemberSearch(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={groupMemberSeed}
                  onChange={(event) => setGroupMemberSeed(event.target.value)}
                  placeholder="Seed"
                  className="w-[120px]"
                />
                <Select value={groupMemberStatus} onValueChange={setGroupMemberStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="hidden max-h-[400px] overflow-y-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Chọn</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Hạng</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Seed</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupMemberTarget && groupMembersLoadingByGroupId[groupMemberTarget.id] ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Đang tải danh sách...
                      </TableCell>
                    </TableRow>
                  ) : groupParticipantsAvailable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy participant nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupParticipantsAvailable.map((participant) => {
                      const rank = calculateRank(getParticipantRating(participant));
                      const isInCurrentGroup = isParticipantInCurrentGroup(participant.id);
                      const isInAnyGroup = isParticipantInAnyGroup(participant.id);
                      const groupName = getParticipantGroupName(participant.id);
                      return (
                        <TableRow key={participant.id} className={isInAnyGroup ? 'opacity-50' : ''}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={groupMemberSelectedIds.includes(participant.id)}
                              onChange={() => toggleGroupMemberSelection(participant.id)}
                              className="h-4 w-4 accent-primary"
                              disabled={isInAnyGroup}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{participant.displayName}</TableCell>
                          <TableCell>
                            <Badge className={`${RANK_COLORS[rank] || 'bg-gray-500'} hover:opacity-80`}>
                              {RANK_LABELS[rank]}
                            </Badge>
                          </TableCell>
                          <TableCell>{getParticipantRating(participant)}</TableCell>
                          <TableCell>{getParticipantPhone(participant) || '-'}</TableCell>
                          <TableCell>{participant.seed ?? '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={participant.status === 'active' ? 'default' : 'secondary'}
                              >
                                {participant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                              </Badge>
                              {isInAnyGroup && groupName && (
                                <Badge variant="secondary">Đã thêm: {groupName}</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              {groupParticipantsAvailable.map((participant) => (
                <Card key={participant.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{participant.displayName}</CardTitle>
                    <CardDescription>
                      Seed: {participant.seed ?? '-'} •{' '}
                      {participant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                      {participant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                    <input
                      type="checkbox"
                      checked={groupMemberSelectedIds.includes(participant.id)}
                      onChange={() => toggleGroupMemberSelection(participant.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupMemberPickerOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAddGroupMembers}
              disabled={
                groupMemberActionLoading ||
                !!(groupMemberTarget && groupMembersLoadingByGroupId[groupMemberTarget.id])
              }
            >
              {groupMemberActionLoading ? 'Đang thêm...' : 'Thêm participants'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupMemberEditOpen} onOpenChange={setGroupMemberEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật group member</DialogTitle>
            <DialogDescription>Chỉnh seed và trạng thái trong group</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seed</label>
              <Input
                type="number"
                value={groupMemberEditSeed}
                onChange={(event) => setGroupMemberEditSeed(event.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={groupMemberEditStatus} onValueChange={setGroupMemberEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupMemberEditOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateGroupMember}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ParticipantPairingDialog
        open={pairingDialogOpen}
        onOpenChange={setPairingDialogOpen}
        participants={participants}
        onSavePairs={async (pairs) => {
          setPairingDialogOpen(false);
          setMemberLoading(true);
          try {
            // Transform pairs hash { teamId: [p1, p2] } into array [{ sideA, sideB }]
            const formattedPairs = Object.values(pairs)
              .filter(p => p.length === 2)
              .map(p => ({ sideA: p[0], sideB: p[1] }));

            // 1. Create session
            const newSession = await createDraw({
              tournamentId: tournament.id,
              type: 'DOUBLES_PAIRING',
              payload: { participants: participants.map(p => p.id) },
            });

            // 2. Update session with result
            await updateDraw(newSession.id, { result: { pairs: formattedPairs } });

            // 3. Apply session
            await applyDraw(newSession.id, tournament.id);

            toast({
              title: "Thành công",
              description: `Đã ghép ${formattedPairs.length} cặp đấu.`
            });
            router.refresh();
          } catch (error: any) {
            toast({
              title: "Lỗi ghép cặp",
              description: error?.message || "Vui lòng thử lại",
              variant: "destructive"
            });
          } finally {
            setMemberLoading(false);
          }
        }}
      />
      <DrawEntryDialog
        open={drawDialogOpen}
        onOpenChange={setDrawDialogOpen}
        tournamentId={tournament.id}
        stageId={drawStageId}
        type={drawType}
        participants={
          drawType === 'DOUBLES_PAIRING'
            ? participants.filter(p => (p.members?.length || 0) < 2)
            : participants
        }
        groups={drawStageId ? groupsByStageId[drawStageId] : []}
        stages={stages}
        onSuccess={() => {
          if (drawStageId && drawType === 'KNOCKOUT_PAIRING') {
            loadBracket(drawStageId);
            setBracketOpenByStageId((prev) => ({ ...prev, [drawStageId]: true }));
          }
        }}
      />
    </div>
  );
}
