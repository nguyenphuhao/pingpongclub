'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createDraw, applyDraw, updateDraw, type DrawSession, type Participant, type Group, type Stage, type StageRule } from '@/app/tournaments/actions';

interface StageWithRules extends Stage {
    rules: StageRule | null;
}
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, User, Users, Trophy } from 'lucide-react';

interface DrawEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tournamentId: string;
    stageId?: string;
    type: 'DOUBLES_PAIRING' | 'GROUP_ASSIGNMENT' | 'KNOCKOUT_PAIRING';
    participants: Participant[]; // For DOUBLES_PAIRING, these are the single members (Participants with 1 member)
    groups?: Group[];
    stages?: StageWithRules[];
    bracketSize?: number;
    onSuccess?: () => void;
}

export function DrawEntryDialog({
    open,
    onOpenChange,
    tournamentId,
    stageId,
    type,
    participants,
    groups = [],
    stages = [],
    bracketSize = 16,
    onSuccess,
}: DrawEntryDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<DrawSession | null>(null);
    const [results, setResults] = useState<Record<string, string>>({}); // Mapping: participantId -> slotValue (PairID, SlotID, or Seed)

    // Knockout specific state
    const [drawMode, setDrawMode] = useState<'CUSTOM' | 'RANDOM' | 'GROUP_RANK'>('CUSTOM');
    const [randomConfig, setRandomConfig] = useState({ size: '16', bestOf: '1' });
    const [groupRankConfig, setGroupRankConfig] = useState({
        sourceStageId: '',
        topNPerGroup: '2',
        wildcardCount: '0',
        size: '16'
    });

    // Initialize or fetch session
    useEffect(() => {
        if (open) {
            setResults({});
            // For now, we create a fresh session every time for simplicity in recording, 
            // but in a real app we might want to resume PENDING sessions.
        }
    }, [open, type]);

    const handleApply = async () => {
        setLoading(true);
        try {
            // 1. Create session
            const newSession = await createDraw({
                tournamentId,
                stageId,
                type,
                payload: { participants: participants.map(p => p.id) },
            });

            // 2. Format results based on type
            let formattedResult: any = {};

            if (type === 'DOUBLES_PAIRING') {
                const pairBuckets: Record<string, string[]> = {};
                Object.entries(results).forEach(([pId, pairId]) => {
                    if (!pairBuckets[pairId]) pairBuckets[pairId] = [];
                    const p = participants.find(item => item.id === pId);
                    const uId = p?.members?.[0]?.userId;
                    if (uId) pairBuckets[pairId].push(uId);
                });

                const pairs = Object.values(pairBuckets)
                    .filter(p => p.length === 2)
                    .map(p => ({ sideA: p[0], sideB: p[1] }));

                formattedResult = { pairs };
            } else if (type === 'GROUP_ASSIGNMENT') {
                const assignments = Object.entries(results).map(([pId, slotVal]) => {
                    const [groupId, rank] = slotVal.split(':');
                    return {
                        groupId,
                        participantId: pId,
                        seedInGroup: parseInt(rank, 10),
                    };
                });
                formattedResult = { assignments };
            } else if (type === 'KNOCKOUT_PAIRING') {
                if (drawMode === 'CUSTOM') {
                    // Manual seeding
                    const sortedEntries = Object.entries(results)
                        .sort((a, b) => parseInt(a[1], 10) - parseInt(b[1], 10))
                        .map(([pId]) => pId);
                    formattedResult = { order: sortedEntries };
                } else if (drawMode === 'RANDOM') {
                    formattedResult = {
                        mode: 'RANDOM',
                        size: parseInt(randomConfig.size, 10),
                        bestOf: parseInt(randomConfig.bestOf, 10),
                    };
                } else if (drawMode === 'GROUP_RANK') {
                    formattedResult = {
                        mode: 'GROUP_RANK',
                        sourceStageId: groupRankConfig.sourceStageId,
                        topNPerGroup: parseInt(groupRankConfig.topNPerGroup, 10),
                        wildcardCount: parseInt(groupRankConfig.wildcardCount, 10),
                        size: parseInt(groupRankConfig.size, 10),
                    };
                }
            }

            // 3. Update session with results
            await updateDraw(newSession.id, { result: formattedResult });

            // 4. Apply session
            await applyDraw(newSession.id, tournamentId);

            toast({
                title: 'Thành công',
                description: 'Đã áp dụng kết quả bốc thăm.',
            });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: 'Lỗi bốc thăm',
                description: error?.message || 'Vui lòng thử lại.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderDoublesForm = () => {
        // Calculate pairs directly to avoid conditional hook usage (Rule of Hooks)
        const pairs: Record<string, string[]> = {};
        Object.entries(results).forEach(([pId, pairId]) => {
            if (pairId) {
                if (!pairs[pairId]) pairs[pairId] = [];
                pairs[pairId].push(pId);
            }
        });

        const isReady = Object.values(pairs).every(p => p.length === 2) && participants.length === Object.keys(results).length;

        return (
            <div className="space-y-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vận động viên</TableHead>
                                <TableHead className="w-[200px]">Số thứ tự cặp (Phiếu bốc)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.displayName}</TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="VD: 1, 2..."
                                            value={results[p.id] || ''}
                                            onChange={(e) => setResults(prev => ({ ...prev, [p.id]: e.target.value }))}
                                            className="w-24"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {Object.entries(pairs).map(([id, pIds]) => (
                        <div key={id} className={`p-2 rounded border text-sm flex justify-between items-center ${pIds.length === 2 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <span className="font-semibold">Cặp {id}:</span>
                            <span>
                                {pIds.map(pid => {
                                    const p = participants.find(item => item.id === pid);
                                    const m = p?.members?.[0]?.user;
                                    return m?.displayName || m?.nickname || p?.displayName;
                                }).join(' - ')}
                            </span>
                            {pIds.length === 2 && <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderGroupsForm = () => {
        // Each group has fixed slots based on rules (usually 4 per group)
        // We'll assume a standard layout for bốc thăm: A1, A2, A3, A4, B1...
        const slots: string[] = [];
        groups.forEach(g => {
            [1, 2, 3, 4].forEach(rank => {
                slots.push(`${g.id}:${rank}`);
            });
        });

        const getSlotLabel = (val: string) => {
            const [gId, rank] = val.split(':');
            const g = groups.find(item => item.id === gId);
            return `${g?.name} - Vị trí ${rank}`;
        };

        return (
            <div className="space-y-4">
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Đối tượng bốc thăm</TableHead>
                                <TableHead>Vị trí bốc thăm (A1, B2...)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.displayName}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={results[p.id] || ''}
                                            onValueChange={(val) => setResults(prev => ({ ...prev, [p.id]: val }))}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Chọn vị trí..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {slots.map(s => {
                                                    const isOccupied = Object.values(results).includes(s) && results[p.id] !== s;
                                                    return (
                                                        <SelectItem key={s} value={s} disabled={isOccupied}>
                                                            {getSlotLabel(s)} {isOccupied ? '(Đã chọn)' : ''}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        );
    };

    const renderKnockoutForm = () => {
        return (
            <Tabs value={drawMode} onValueChange={(v) => setDrawMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="CUSTOM">Thủ công</TabsTrigger>
                    <TabsTrigger value="RANDOM">Ngẫu nhiên</TabsTrigger>
                    <TabsTrigger value="GROUP_RANK">Từ vòng bảng</TabsTrigger>
                </TabsList>

                <TabsContent value="CUSTOM" className="space-y-4 pt-4">
                    <DialogDescription>
                        Nhập số thứ tự bốc thăm (Seed) cho từng đội. Sơ đồ Bracket sẽ tự động được sắp xếp theo các vị trí này.
                    </DialogDescription>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Đối tượng bốc thăm</TableHead>
                                <TableHead>Hạt giống (1-{participants.length})</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.displayName}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="1"
                                            max={participants.length}
                                            value={results[p.id] || ''}
                                            onChange={(e) => setResults(prev => ({ ...prev, [p.id]: e.target.value }))}
                                            className="w-24"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="RANDOM" className="space-y-4 pt-4">
                    <DialogDescription>
                        Hệ thống sẽ bốc thăm ngẫu nhiên các đội vào Bracket.
                    </DialogDescription>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kích thước Bracket (Size)</label>
                            <Input
                                type="number"
                                value={randomConfig.size}
                                onChange={(e) => setRandomConfig(prev => ({ ...prev, size: e.target.value }))}
                                placeholder="VD: 16"
                            />
                            <p className="text-xs text-muted-foreground">Phải là lũy thừa của 2 (4, 8, 16, 32...)</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số set đấu (Best Of)</label>
                            <Input
                                type="number"
                                value={randomConfig.bestOf}
                                onChange={(e) => setRandomConfig(prev => ({ ...prev, bestOf: e.target.value }))}
                                placeholder="VD: 3"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="GROUP_RANK" className="space-y-4 pt-4">
                    <DialogDescription>
                        Lấy kết quả từ vòng bảng để xếp vào Bracket (VD: Nhất A gặp Nhì B).
                    </DialogDescription>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chọn Vòng bảng nguồn</label>
                            <Select
                                value={groupRankConfig.sourceStageId}
                                onValueChange={(val) => setGroupRankConfig(prev => ({ ...prev, sourceStageId: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vòng bảng..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.filter(s => s.type === 'GROUP').map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Top N mỗi bảng</label>
                                <Input
                                    type="number"
                                    value={groupRankConfig.topNPerGroup}
                                    onChange={(e) => setGroupRankConfig(prev => ({ ...prev, topNPerGroup: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Vé vớt (Wildcard)</label>
                                <Input
                                    type="number"
                                    value={groupRankConfig.wildcardCount}
                                    onChange={(e) => setGroupRankConfig(prev => ({ ...prev, wildcardCount: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kích thước Bracket (Size)</label>
                            <Input
                                type="number"
                                value={groupRankConfig.size}
                                onChange={(e) => setGroupRankConfig(prev => ({ ...prev, size: e.target.value }))}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl flex flex-col h-[85vh]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        {type === 'DOUBLES_PAIRING' && <Users className="h-5 w-5 text-blue-600" />}
                        {type === 'GROUP_ASSIGNMENT' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {type === 'KNOCKOUT_PAIRING' && <Trophy className="h-5 w-5 text-yellow-600" />}
                        <DialogTitle>
                            {type === 'DOUBLES_PAIRING' && 'Bốc thăm ghép đôi'}
                            {type === 'GROUP_ASSIGNMENT' && 'Bốc thăm chia bảng'}
                            {type === 'KNOCKOUT_PAIRING' && 'Bốc thăm Bracket'}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        Ghi nhận kết quả bốc thăm thủ công từ ngoài đời vào hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    {type === 'DOUBLES_PAIRING' && renderDoublesForm()}
                    {type === 'GROUP_ASSIGNMENT' && renderGroupsForm()}
                    {type === 'KNOCKOUT_PAIRING' && renderKnockoutForm()}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleApply} disabled={loading || (type === 'DOUBLES_PAIRING' && Object.keys(results).length === 0)}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận & Áp dụng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
