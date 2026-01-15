'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    useDroppable,
    useDraggable,
    pointerWithin,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Participant } from '@/app/tournaments/actions';
import { GripVertical, Users, User, Plus, X, Loader2 } from 'lucide-react';

// Simple ID generator to avoid adding external dependency
const generateId = () => Math.random().toString(36).substring(2, 9);

interface ParticipantPairingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participants: Participant[];
    onSavePairs: (pairs: { [key: string]: string[] }) => Promise<void>;
    isSaving?: boolean;
}

interface DraggableParticipantProps {
    participant: Participant;
    id: string;
}

function DraggableParticipant({ participant, id }: DraggableParticipantProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { participant },
    });

    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        }
        : undefined;

    const getMemberName = (p: Participant) => {
        if (!p.members || p.members.length === 0) return p.displayName;
        return p.members.map((m) => m.user.displayName || m.user.nickname).join(' / ');
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="mb-2 flex cursor-grab items-center gap-2 rounded-md border bg-white p-2 text-sm shadow-sm hover:bg-gray-50 active:cursor-grabbing"
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 truncate font-medium">
                {getMemberName(participant)}
            </div>
        </div>
    );
}

function TeamDroppable({
    id,
    members,
    onRemoveMember,
}: {
    id: string;
    members: Participant[];
    onRemoveMember: (pId: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type: 'team', teamId: id },
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[80px] rounded-lg border-2 border-dashed p-3 transition-colors ${isOver
                ? 'border-primary bg-primary/5'
                : members.length === 2
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-muted bg-muted/30'
                }`}
        >
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Team</span>
                <span className={members.length === 2 ? 'text-green-600' : ''}>
                    {members.length}/2
                </span>
            </div>
            <div className="space-y-2">
                {members.map((p) => (
                    <DraggableParticipant key={p.id} id={p.id} participant={p} />
                ))}
            </div>
        </div>
    );
}

function NewTeamDropZone() {
    const { setNodeRef, isOver } = useDroppable({
        id: 'create-new-team',
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex h-[80px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${isOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'
                }`}
        >
            <div className="flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Tạo đội mới</span>
            </div>
        </div>
    );
}

function UnassignedDropZone({ children, count }: { children: React.ReactNode; count: number }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'unassigned-pool',
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex h-full flex-col rounded-lg border transition-colors ${isOver ? 'border-primary bg-primary/5' : 'bg-muted/10'
                }`}
        >
            <div className="border-b p-3 font-semibold">
                Vận động viên ({count})
            </div>
            <ScrollArea className="flex-1 p-3">
                {children}
                {count === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Đã ghép cặp hết
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

export function ParticipantPairingDialog({
    open,
    onOpenChange,
    participants,
    onSavePairs,
    isSaving,
}: ParticipantPairingDialogProps) {
    const [assignments, setAssignments] = useState<Record<string, string | null>>({});
    const [activeDragItem, setActiveDragItem] = useState<Participant | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalContainer(document.body);
    }, []);

    useEffect(() => {
        if (open) {
            const initialAssignments: Record<string, string | null> = {};
            participants.forEach((p) => {
                initialAssignments[p.id] = null;
            });
            setAssignments(initialAssignments);
        }
    }, [open, participants]);

    const unassignedParticipants = useMemo(() => {
        return participants.filter((p) => !assignments[p.id]);
    }, [participants, assignments]);

    const teams = useMemo(() => {
        const teamMap: Record<string, Participant[]> = {};
        Object.entries(assignments).forEach(([pId, teamId]) => {
            if (teamId) {
                if (!teamMap[teamId]) teamMap[teamId] = [];
                const p = participants.find((item) => item.id === pId);
                if (p) teamMap[teamId].push(p);
            }
        });
        return teamMap;
    }, [assignments, participants]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const participant = participants.find((p) => p.id === active.id);
        if (participant) setActiveDragItem(participant);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const participantId = active.id as string;
        const targetId = over.id as string;

        if (targetId === 'unassigned-pool') {
            setAssignments((prev) => ({
                ...prev,
                [participantId]: null,
            }));
            return;
        }

        if (targetId === 'create-new-team') {
            const newTeamId = `new-team-${generateId()}`;
            setAssignments((prev) => ({
                ...prev,
                [participantId]: newTeamId,
            }));
            return;
        }

        // Dropping into an existing team
        const targetTeamId = targetId;

        // Check if team exists (it might be a drop on a container)
        // Actually, targetId is the droppable id which IS the teamId

        // Check if dropping into same team
        if (assignments[participantId] === targetTeamId) {
            return;
        }

        const targetTeamMembers = Object.entries(assignments)
            .filter(([_, tId]) => tId === targetTeamId)
            .map(([pId]) => pId);

        if (targetTeamMembers.length >= 2) {
            return;
        }

        setAssignments((prev) => ({
            ...prev,
            [participantId]: targetTeamId,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[80vh] max-w-5xl flex-col">
                <DialogHeader>
                    <DialogTitle>Ghép đôi thi đấu</DialogTitle>
                    <DialogDescription>
                        Kéo thả vận động viên vào khu vực đội để ghép cặp.
                    </DialogDescription>
                </DialogHeader>

                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex min-h-0 flex-1 gap-6">
                        <div className="w-1/3">
                            <UnassignedDropZone count={unassignedParticipants.length}>
                                {unassignedParticipants.map((p) => (
                                    <DraggableParticipant key={p.id} id={p.id} participant={p} />
                                ))}
                            </UnassignedDropZone>
                        </div>

                        <div className="flex flex-1 flex-col rounded-lg border bg-muted/10">
                            <div className="flex items-center justify-between border-b p-3">
                                <span className="font-semibold">Đội đã ghép ({Object.keys(teams).length})</span>
                            </div>
                            <ScrollArea className="flex-1 p-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <NewTeamDropZone />
                                    </div>

                                    {Object.entries(teams).map(([teamId, members]) => (
                                        <TeamDroppable
                                            key={teamId}
                                            id={teamId}
                                            members={members}
                                            onRemoveMember={() => { }} // Not needed if draggable
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {portalContainer && createPortal(
                        <DragOverlay>
                            {activeDragItem ? (
                                <div className="flex items-center gap-2 rounded-md border bg-white p-2 text-sm shadow-md opacity-90 cursor-grabbing">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{activeDragItem.displayName}</span>
                                </div>
                            ) : null}
                        </DragOverlay>,
                        portalContainer
                    )}
                </DndContext>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={() => {
                            const finalPairs: Record<string, string[]> = {};
                            Object.entries(teams).forEach(([teamId, members]) => {
                                if (members.length === 2) {
                                    finalPairs[teamId] = members.map((m) => m.id);
                                }
                            });
                            onSavePairs(finalPairs);
                        }}
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận & Áp dụng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
