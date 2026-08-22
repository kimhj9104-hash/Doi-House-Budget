"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import { toISODate } from "@/lib/format";
import { addNote, deleteNote, updateNote } from "@/lib/data/notes";
import type { Note } from "@/lib/types";

function formatNoteDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteEditForm({
  note,
  onSave,
  onCancel,
}: {
  note: Note;
  onSave: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content ?? "");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setPending(true);
    try {
      await onSave(title.trim(), content.trim());
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={60}
        className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={4}
        className="resize-none rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !title.trim()}
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-hover"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { householdId, user, members, notes } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.uid, m.displayName])),
    [members],
  );

  const filteredNotes = useMemo(() => {
    let list = notes;
    if (startDate || endDate) {
      list = list.filter((n) => {
        const d = toISODate(n.createdAt);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          (n.title ?? "").toLowerCase().includes(q) ||
          (n.content ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [notes, search, startDate, endDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !user || !title.trim()) return;
    setPending(true);
    try {
      await addNote(householdId, user.uid, title.trim(), content.trim());
      setTitle("");
      setContent("");
      setShowForm(false);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!householdId) return;
    if (!confirm("이 메모를 삭제할까요?")) return;
    await deleteNote(householdId, noteId);
  }

  async function handleUpdate(noteId: string, newTitle: string, newContent: string) {
    if (!householdId) return;
    await updateNote(householdId, noteId, { title: newTitle, content: newContent });
    setEditingId(null);
  }

  function toggleExpanded(noteId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  if (!householdId) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">메모장</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {showForm ? (
            <>
              <X size={14} strokeWidth={2.5} />
              닫기
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={2.5} />
              글쓰기
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClass} mb-4 flex flex-col gap-2 p-4`}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            maxLength={60}
            autoFocus
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지사항이나 공유할 내용을 적어보세요"
            maxLength={500}
            rows={3}
            className="resize-none rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
          >
            등록
          </button>
        </form>
      )}

      <div className="relative mb-2">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목, 내용으로 검색"
          className="w-full rounded-xl border border-border-strong bg-white py-2.5 pl-9 pr-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || undefined}
          className="rounded-xl border border-border-strong bg-white px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        <span className="text-sm text-subtle-foreground">~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || undefined}
          className="rounded-xl border border-border-strong bg-white px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-surface-hover"
          >
            <X size={12} />
            기간 필터 해제
          </button>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <div className={`${cardClass} px-5 py-16 text-center`}>
          <p className="text-sm text-subtle-foreground">
            {notes.length === 0 ? "아직 등록된 메모가 없어요" : "조건에 맞는 메모가 없어요"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredNotes.map((n) => {
            const isExpanded = expandedIds.has(n.id);
            const isEditing = editingId === n.id;
            return (
              <li key={n.id} className={`${cardClass} p-4`}>
                {isEditing ? (
                  <NoteEditForm
                    note={n}
                    onSave={(newTitle, newContent) => handleUpdate(n.id, newTitle, newContent)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(n.id)}
                        className="flex flex-1 items-start gap-2 text-left"
                      >
                        <ChevronDown
                          size={16}
                          className={`mt-0.5 shrink-0 text-subtle-foreground transition ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {n.title || "(제목 없음)"}
                          </p>
                          <p className="mt-0.5 text-xs text-subtle-foreground">
                            {memberMap.get(n.uid) || "가족"} · {formatNoteDate(n.createdAt)}
                            {n.updatedAt && " (수정됨)"}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(n.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-subtle-foreground transition hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-subtle-foreground transition hover:text-expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <p className="ml-6 mt-2 whitespace-pre-wrap text-sm text-foreground">
                        {n.content || "내용이 없어요"}
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
