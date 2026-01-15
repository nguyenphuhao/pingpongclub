'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import type { StageRulePreset } from '@/app/tournaments/actions';
import {
  createStageRulePreset,
  deleteStageRulePreset,
  updateStageRulePreset,
} from '@/app/tournaments/actions';

const TIE_BREAK_OPTIONS = [
  { value: 'matchPoints', label: 'Match points' },
  { value: 'h2h', label: 'Đối đầu (H2H)' },
  { value: 'gamesWon', label: 'Số game thắng' },
  { value: 'gameDiff', label: 'Hiệu số game' },
  { value: 'pointsDiff', label: 'Hiệu số điểm' },
];

const DEFAULT_PRESET = {
  name: '',
  description: '',
  winPoints: '1',
  lossPoints: '0',
  byePoints: '1',
  countByeGamesPoints: false,
  countWalkoverAsPlayed: true,
  tieBreakOrder: ['matchPoints', 'h2h'],
  h2hMode: 'TWO_WAY_ONLY',
};

interface StageRulePresetsClientProps {
  initialPresets: StageRulePreset[];
}

export function StageRulePresetsClient({ initialPresets }: StageRulePresetsClientProps) {
  const [presets, setPresets] = useState<StageRulePreset[]>(initialPresets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...DEFAULT_PRESET });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setFormState({ ...DEFAULT_PRESET });
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const openEdit = (preset: StageRulePreset) => {
    setEditingId(preset.id);
    setFormState({
      name: preset.name,
      description: preset.description || '',
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
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (formState.name.trim().length < 2) {
      setErrorMessage('Tên preset phải có ít nhất 2 ký tự.');
      return;
    }
    if (formState.tieBreakOrder.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 tiêu chí tie-break.');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      winPoints: Number(formState.winPoints) || 0,
      lossPoints: Number(formState.lossPoints) || 0,
      byePoints: Number(formState.byePoints) || 0,
      countByeGamesPoints: formState.countByeGamesPoints,
      countWalkoverAsPlayed: formState.countWalkoverAsPlayed,
      tieBreakOrder: formState.tieBreakOrder,
      h2hMode: formState.h2hMode,
    };

    try {
      if (editingId) {
        const updated = await updateStageRulePreset(editingId, payload);
        setPresets((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createStageRulePreset(payload);
        setPresets((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (error: any) {
      setErrorMessage(error.message || 'Không thể lưu preset.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (presetId: string) => {
    await deleteStageRulePreset(presetId);
    setPresets((prev) => prev.filter((item) => item.id !== presetId));
  };

  const updateTieBreakOrder = (nextOrder: string[]) => {
    setFormState((prev) => ({
      ...prev,
      tieBreakOrder: nextOrder,
    }));
  };

  const handleAddTieBreak = (value: string) => {
    if (!value || formState.tieBreakOrder.includes(value)) {
      return;
    }
    updateTieBreakOrder([...formState.tieBreakOrder, value]);
  };

  const handleMoveTieBreak = (index: number, direction: 'up' | 'down') => {
    const next = [...formState.tieBreakOrder];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateTieBreakOrder(next);
  };

  const handleRemoveTieBreak = (value: string) => {
    updateTieBreakOrder(formState.tieBreakOrder.filter((item) => item !== value));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stage Rule Presets</h1>
          <p className="text-muted-foreground">
            Thiết lập sẵn quy tắc tính điểm và tie-break để dùng lại nhanh
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo preset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách presets</CardTitle>
          <CardDescription>Chọn preset để cập nhật hoặc xóa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {presets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Chưa có preset nào</div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{preset.name}</h3>
                    <Badge variant="secondary">H2H: {preset.h2hMode}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {preset.description || 'Chưa có mô tả'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Win: {preset.winPoints}</Badge>
                    <Badge variant="outline">Loss: {preset.lossPoints}</Badge>
                    <Badge variant="outline">Bye: {preset.byePoints}</Badge>
                    <Badge variant="outline">
                      Tie-break: {preset.tieBreakOrder?.join(' → ') || 'matchPoints → h2h'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(preset)}>
                    <Pencil className="mr-2 h-4 w-4" />
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
                        <AlertDialogTitle>Xóa preset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Preset sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(preset.id)}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Cập nhật preset' : 'Tạo preset mới'}</DialogTitle>
            <DialogDescription>
              Chuẩn hóa rules để áp dụng nhanh cho nhiều stage
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Tên preset</label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                className="min-h-[90px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Win points</label>
              <Input
                type="number"
                value={formState.winPoints}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, winPoints: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Loss points</label>
              <Input
                type="number"
                value={formState.lossPoints}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, lossPoints: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bye points</label>
              <Input
                type="number"
                value={formState.byePoints}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, byePoints: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">H2H mode</label>
              <Select
                value={formState.h2hMode}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, h2hMode: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn H2H mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWO_WAY_ONLY">Two-way only</SelectItem>
                  <SelectItem value="MINI_TABLE">Mini table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 lg:col-span-2">
              <label className="text-sm font-medium">Tie-break order</label>
              <div className="space-y-2">
                {formState.tieBreakOrder.map((value, index) => {
                  const label = TIE_BREAK_OPTIONS.find((item) => item.value === value)?.label || value;
                  return (
                    <div
                      key={`${value}-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="text-sm">
                        {index + 1}. {label}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTieBreak(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTieBreak(index, 'down')}
                          disabled={index === formState.tieBreakOrder.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTieBreak(value)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Select onValueChange={handleAddTieBreak}>
                <SelectTrigger>
                  <SelectValue placeholder="Thêm tiêu chí tie-break" />
                </SelectTrigger>
                <SelectContent>
                  {TIE_BREAK_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={formState.tieBreakOrder.includes(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-2 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Tính điểm bye</p>
                  <p className="text-xs text-muted-foreground">Cộng bye points vào tổng điểm</p>
                </div>
                <Switch
                  checked={formState.countByeGamesPoints}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({ ...prev, countByeGamesPoints: value }))
                  }
                />
              </div>
              <div className="flex flex-1 items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Walkover tính là đã chơi</p>
                  <p className="text-xs text-muted-foreground">Tính vào số trận</p>
                </div>
                <Switch
                  checked={formState.countWalkoverAsPlayed}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({ ...prev, countWalkoverAsPlayed: value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
