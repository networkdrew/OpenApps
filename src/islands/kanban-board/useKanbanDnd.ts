import { useCallback, useMemo, useRef, useState } from "react";

export interface DndColumn {
  id: string;
  /** Visible card ids in this column, in order (post-filter/search). */
  cardIds: string[];
}

export interface KanbanDragState {
  cardId: string | null;
  overColumnId: string | null;
  /** The visible card the dragged card would land before, or null for "end of column". Resolving this against the *unfiltered* column list (see KanbanBoardApp) is what keeps drops correct while a filter/search is active. */
  overBeforeCardId: string | null;
}

const IDLE: KanbanDragState = {
  cardId: null,
  overColumnId: null,
  overBeforeCardId: null,
};

/**
 * Pointer-based (mouse + touch + pen, unified) drag-and-drop across kanban
 * columns. Deliberately not native HTML5 drag-and-drop: that API has no
 * real touch support, which this board needs for mobile. Every drag action
 * this hook powers also has a keyboard equivalent (CardTile's arrow-key
 * handling and its "Move card" menu) — this hook is an enhancement, not the
 * only way to move a card.
 *
 * Targets are expressed as "drop before this card id" (or null for end of
 * column) rather than a numeric index, specifically so a drop computed from
 * the currently *filtered/visible* card list still resolves to the correct
 * position in the board's real, unfiltered card order.
 */
export function useKanbanDnd(
  columns: DndColumn[],
  onMove: (
    cardId: string,
    toColumnId: string,
    beforeCardId: string | null,
  ) => void,
) {
  const [state, setState] = useState<KanbanDragState>(IDLE);
  const cardElsRef = useRef(new Map<string, HTMLElement>());
  const columnElsRef = useRef(new Map<string, HTMLElement>());
  const draggingIdRef = useRef<string | null>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const registerCard = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardElsRef.current.set(id, el);
    else cardElsRef.current.delete(id);
  }, []);

  const registerColumn = useCallback((id: string, el: HTMLElement | null) => {
    if (el) columnElsRef.current.set(id, el);
    else columnElsRef.current.delete(id);
  }, []);

  const findTarget = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { columnId: string; beforeCardId: string | null } | null => {
      let targetColumnId: string | null = null;
      let bestXDist = Infinity;
      for (const [id, el] of columnElsRef.current) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          targetColumnId = id;
          break;
        }
        const dist =
          clientX < rect.left ? rect.left - clientX : clientX - rect.right;
        if (dist < bestXDist) {
          bestXDist = dist;
          targetColumnId = id;
        }
      }
      if (!targetColumnId) return null;

      const cardIds = (
        columnsRef.current.find((c) => c.id === targetColumnId)?.cardIds ?? []
      ).filter((id) => id !== draggingIdRef.current);

      for (const id of cardIds) {
        const el = cardElsRef.current.get(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY < mid) {
          return { columnId: targetColumnId, beforeCardId: id };
        }
      }
      return { columnId: targetColumnId, beforeCardId: null };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (cardId: string) => (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse")
        return;
      e.currentTarget.setPointerCapture(e.pointerId);
      draggingIdRef.current = cardId;
      setState({ cardId, overColumnId: null, overBeforeCardId: null });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!draggingIdRef.current) return;
      e.preventDefault();
      const target = findTarget(e.clientX, e.clientY);
      setState({
        cardId: draggingIdRef.current,
        overColumnId: target?.columnId ?? null,
        overBeforeCardId: target?.beforeCardId ?? null,
      });
    },
    [findTarget],
  );

  const finishDrag = useCallback(() => {
    const cardId = draggingIdRef.current;
    const columnId = state.overColumnId;
    const beforeCardId = state.overBeforeCardId;
    draggingIdRef.current = null;
    setState(IDLE);
    if (cardId && columnId) {
      onMove(cardId, columnId, beforeCardId);
    }
  }, [state.overColumnId, state.overBeforeCardId, onMove]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      finishDrag();
    },
    [finishDrag],
  );

  const handlePointerCancel = useCallback(() => {
    draggingIdRef.current = null;
    setState(IDLE);
  }, []);

  return useMemo(
    () => ({
      dragState: state,
      registerCard,
      registerColumn,
      cardHandleProps: (cardId: string) => ({
        onPointerDown: handlePointerDown(cardId),
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel,
        style: { touchAction: "none" as const },
      }),
    }),
    [
      state,
      registerCard,
      registerColumn,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerCancel,
    ],
  );
}
