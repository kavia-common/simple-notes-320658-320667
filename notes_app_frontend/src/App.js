import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Local storage key for persisting notes.
 * Kept stable to avoid breaking saved notes across deploys.
 */
const STORAGE_KEY = "simple-notes.notes.v1";

/**
 * Creates a stable-ish random id without external dependencies.
 * crypto.randomUUID is preferred when available.
 */
function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Safe JSON parse helper.
 */
function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Format last updated timestamp.
 */
function formatTimestamp(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generates a plain-text preview from content.
 */
function makePreview(text, maxLen = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "No content";
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 1)}…`;
}

/**
 * Returns notes sorted with most recently updated first.
 */
function sortNotes(notes) {
  return [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// PUBLIC_INTERFACE
function App() {
  /** Notes: { id, title, content, createdAt, updatedAt } */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [query, setQuery] = useState("");

  // Editor state (draft) - only applied to selected note
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const titleInputRef = useRef(null);

  // Load initial notes from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = safeParseJson(raw || "[]", []);
    const normalized = Array.isArray(loaded) ? loaded : [];
    const sorted = sortNotes(
      normalized
        .filter((n) => n && typeof n === "object" && n.id)
        .map((n) => ({
          id: String(n.id),
          title: typeof n.title === "string" ? n.title : "",
          content: typeof n.content === "string" ? n.content : "",
          createdAt: typeof n.createdAt === "number" ? n.createdAt : Date.now(),
          updatedAt: typeof n.updatedAt === "number" ? n.updatedAt : Date.now(),
        }))
    );

    setNotes(sorted);
    setSelectedId(sorted[0]?.id ?? null);
  }, []);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  // When selection changes, reset draft to selected note
  useEffect(() => {
    setDraftTitle(selectedNote?.title ?? "");
    setDraftContent(selectedNote?.content ?? "");
    setIsDirty(false);

    // focus title for better UX when switching/creating
    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus?.();
    });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = sortNotes(notes);
    if (!q) return base;
    return base.filter((n) => {
      const hay = `${n.title}\n${n.content}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, query]);

  const dirtyComparedToSelected = useMemo(() => {
    if (!selectedNote) return false;
    return (draftTitle ?? "") !== (selectedNote.title ?? "") || (draftContent ?? "") !== (selectedNote.content ?? "");
  }, [draftTitle, draftContent, selectedNote]);

  useEffect(() => {
    setIsDirty(dirtyComparedToSelected);
  }, [dirtyComparedToSelected]);

  // PUBLIC_INTERFACE
  const handleCreateNote = () => {
    const now = Date.now();
    const newNote = {
      id: createId(),
      title: "Untitled note",
      content: "",
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => sortNotes([newNote, ...prev]));
    setSelectedId(newNote.id);
    setQuery("");
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = (id) => {
    const note = notes.find((n) => n.id === id);
    const title = note?.title?.trim() ? `“${note.title.trim()}”` : "this note";
    const ok = window.confirm(`Delete ${title}? This cannot be undone.`);
    if (!ok) return;

    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  // PUBLIC_INTERFACE
  const handleSave = () => {
    if (!selectedNote) return;

    const now = Date.now();
    const nextTitle = (draftTitle || "").trim();
    const sanitizedTitle = nextTitle || "Untitled note";

    setNotes((prev) =>
      sortNotes(
        prev.map((n) =>
          n.id === selectedNote.id
            ? {
                ...n,
                title: sanitizedTitle,
                content: draftContent ?? "",
                updatedAt: now,
              }
            : n
        )
      )
    );

    setIsDirty(false);
  };

  // PUBLIC_INTERFACE
  const handleDiscard = () => {
    if (!selectedNote) return;
    setDraftTitle(selectedNote.title ?? "");
    setDraftContent(selectedNote.content ?? "");
    setIsDirty(false);
  };

  const onEditorKeyDown = (e) => {
    // Cmd/Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="brandTitle">Notes</div>
            <div className="brandSubtitle">Lightweight local notes — no account needed</div>
          </div>
        </div>

        <div className="topbarActions">
          <button className="btn btnPrimary" onClick={handleCreateNote}>
            New note
          </button>
        </div>
      </header>

      <main className="layout" onKeyDown={onEditorKeyDown}>
        <aside className="sidebar" aria-label="Notes list">
          <div className="sidebarHeader">
            <div className="searchWrap">
              <input
                className="searchInput"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
              />
            </div>
            <div className="sidebarMeta" aria-live="polite">
              {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="noteList" role="list">
            {filteredNotes.length === 0 ? (
              <div className="emptyList">
                <div className="emptyTitle">No notes found</div>
                <div className="emptyDesc">Create a new note or clear your search.</div>
              </div>
            ) : (
              filteredNotes.map((n) => {
                const active = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`noteCard ${active ? "active" : ""}`}
                    onClick={() => setSelectedId(n.id)}
                    role="listitem"
                    aria-current={active ? "true" : "false"}
                    title={n.title || "Untitled note"}
                  >
                    <div className="noteCardTop">
                      <div className="noteCardTitle">{n.title?.trim() ? n.title.trim() : "Untitled note"}</div>
                      <div className="noteCardTime">{formatTimestamp(n.updatedAt)}</div>
                    </div>
                    <div className="noteCardPreview">{makePreview(n.content)}</div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="editor" aria-label="Note editor">
          {!selectedNote ? (
            <div className="editorEmpty">
              <div className="editorEmptyTitle">No note selected</div>
              <div className="editorEmptyDesc">Pick a note from the list, or create a new one.</div>
              <button className="btn btnPrimary" onClick={handleCreateNote}>
                Create your first note
              </button>
            </div>
          ) : (
            <div className="editorCard">
              <div className="editorHeader">
                <div className="editorHeaderLeft">
                  <div className="editorLabel">Title</div>
                  <input
                    ref={titleInputRef}
                    className="titleInput"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Untitled note"
                    aria-label="Note title"
                  />
                </div>

                <div className="editorHeaderRight">
                  <div className="timestamps">
                    <div className="timestampRow">
                      <span className="timestampKey">Updated</span>
                      <span className="timestampVal">{formatTimestamp(selectedNote.updatedAt)}</span>
                    </div>
                    <div className="timestampRow">
                      <span className="timestampKey">Created</span>
                      <span className="timestampVal">{formatTimestamp(selectedNote.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contentArea">
                <div className="editorLabel">Content</div>
                <textarea
                  className="contentInput"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Write something…"
                  aria-label="Note content"
                  rows={12}
                />
              </div>

              <div className="editorFooter">
                <div className="dirtyState" aria-live="polite">
                  {isDirty ? "Unsaved changes" : "All changes saved"}
                  <span className="kbdHint">Tip: Ctrl/Cmd + S to save</span>
                </div>

                <div className="editorActions">
                  <button className="btn btnGhost" onClick={() => handleDeleteNote(selectedNote.id)}>
                    Delete
                  </button>

                  <button className="btn" onClick={handleDiscard} disabled={!isDirty}>
                    Discard
                  </button>

                  <button className="btn btnPrimary" onClick={handleSave} disabled={!isDirty}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>
          Stored locally in your browser (<span className="mono">localStorage</span>). Clearing site data will remove notes.
        </span>
      </footer>
    </div>
  );
}

export default App;
