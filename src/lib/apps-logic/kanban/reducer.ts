import {
  createBoard,
  createColumn,
  createEmptyCard,
  createEmptyState,
  duplicateBoard,
  type KanbanBoard,
  type KanbanCard,
  type KanbanState,
  type Priority,
} from "./model";

export type KanbanAction =
  | { type: "ADD_BOARD"; name: string }
  | { type: "DUPLICATE_BOARD"; boardId: string; name: string }
  | { type: "DELETE_BOARD"; boardId: string }
  | { type: "RENAME_BOARD"; boardId: string; name: string }
  | { type: "SET_ACTIVE_BOARD"; boardId: string }
  | { type: "ADD_COLUMN"; boardId: string; title: string }
  | { type: "RENAME_COLUMN"; boardId: string; columnId: string; title: string }
  | { type: "DELETE_COLUMN"; boardId: string; columnId: string }
  | { type: "REORDER_COLUMNS"; boardId: string; columnIds: string[] }
  | { type: "ADD_CARD"; boardId: string; columnId: string; title: string }
  | {
      type: "UPDATE_CARD";
      boardId: string;
      cardId: string;
      patch: Partial<
        Pick<
          KanbanCard,
          "title" | "description" | "priority" | "dueDate" | "labelIds"
        >
      >;
    }
  | { type: "DELETE_CARD"; boardId: string; cardId: string }
  | {
      type: "MOVE_CARD";
      boardId: string;
      cardId: string;
      toColumnId: string;
      toIndex: number;
    }
  | {
      type: "ADD_LABEL";
      boardId: string;
      id: string;
      name: string;
      color: string;
    }
  | { type: "DELETE_LABEL"; boardId: string; labelId: string }
  | { type: "REPLACE_STATE"; state: KanbanState }
  | { type: "CLEAR_ALL" };

function updateBoard(
  state: KanbanState,
  boardId: string,
  fn: (board: KanbanBoard) => KanbanBoard,
): KanbanState {
  return {
    ...state,
    boards: state.boards.map((b) => (b.id === boardId ? fn(b) : b)),
  };
}

function touch(): Pick<KanbanBoard, "updatedAt"> {
  return { updatedAt: new Date().toISOString() };
}

export function kanbanReducer(
  state: KanbanState,
  action: KanbanAction,
): KanbanState {
  switch (action.type) {
    case "ADD_BOARD": {
      const board = createBoard(action.name);
      return {
        ...state,
        boards: [...state.boards, board],
        activeBoardId: board.id,
      };
    }

    case "DUPLICATE_BOARD": {
      const source = state.boards.find((b) => b.id === action.boardId);
      if (!source) return state;
      const copy = duplicateBoard(source, action.name);
      return {
        ...state,
        boards: [...state.boards, copy],
        activeBoardId: copy.id,
      };
    }

    case "DELETE_BOARD": {
      const boards = state.boards.filter((b) => b.id !== action.boardId);
      const activeBoardId =
        state.activeBoardId === action.boardId
          ? (boards[0]?.id ?? null)
          : state.activeBoardId;
      return { ...state, boards, activeBoardId };
    }

    case "RENAME_BOARD":
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        name: action.name,
        ...touch(),
      }));

    case "SET_ACTIVE_BOARD":
      return { ...state, activeBoardId: action.boardId };

    case "ADD_COLUMN":
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        columns: [...b.columns, createColumn(action.title)],
        ...touch(),
      }));

    case "RENAME_COLUMN":
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        columns: b.columns.map((c) =>
          c.id === action.columnId ? { ...c, title: action.title } : c,
        ),
        ...touch(),
      }));

    case "DELETE_COLUMN":
      return updateBoard(state, action.boardId, (b) => {
        const column = b.columns.find((c) => c.id === action.columnId);
        if (!column) return b;
        const cards = { ...b.cards };
        for (const cardId of column.cardIds) delete cards[cardId];
        return {
          ...b,
          columns: b.columns.filter((c) => c.id !== action.columnId),
          cards,
          ...touch(),
        };
      });

    case "REORDER_COLUMNS":
      return updateBoard(state, action.boardId, (b) => {
        const byId = new Map(b.columns.map((c) => [c.id, c]));
        const columns = action.columnIds
          .map((id) => byId.get(id))
          .filter((c): c is (typeof b.columns)[number] => c !== undefined);
        if (columns.length !== b.columns.length) return b;
        return { ...b, columns, ...touch() };
      });

    case "ADD_CARD":
      return updateBoard(state, action.boardId, (b) => {
        const column = b.columns.find((c) => c.id === action.columnId);
        if (!column) return b;
        const card = createEmptyCard(action.title);
        return {
          ...b,
          cards: { ...b.cards, [card.id]: card },
          columns: b.columns.map((c) =>
            c.id === action.columnId
              ? { ...c, cardIds: [...c.cardIds, card.id] }
              : c,
          ),
          ...touch(),
        };
      });

    case "UPDATE_CARD":
      return updateBoard(state, action.boardId, (b) => {
        const card = b.cards[action.cardId];
        if (!card) return b;
        return {
          ...b,
          cards: {
            ...b.cards,
            [action.cardId]: {
              ...card,
              ...action.patch,
              updatedAt: new Date().toISOString(),
            },
          },
          ...touch(),
        };
      });

    case "DELETE_CARD":
      return updateBoard(state, action.boardId, (b) => {
        if (!b.cards[action.cardId]) return b;
        const cards = { ...b.cards };
        delete cards[action.cardId];
        return {
          ...b,
          cards,
          columns: b.columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== action.cardId),
          })),
          ...touch(),
        };
      });

    case "MOVE_CARD":
      return updateBoard(state, action.boardId, (b) => {
        if (!b.cards[action.cardId]) return b;
        const toColumn = b.columns.find((c) => c.id === action.toColumnId);
        if (!toColumn) return b;

        const columnsWithoutCard = b.columns.map((c) => ({
          ...c,
          cardIds: c.cardIds.filter((id) => id !== action.cardId),
        }));

        const clampedIndex = Math.max(
          0,
          Math.min(
            action.toIndex,
            columnsWithoutCard.find((c) => c.id === action.toColumnId)?.cardIds
              .length ?? 0,
          ),
        );

        const columns = columnsWithoutCard.map((c) => {
          if (c.id !== action.toColumnId) return c;
          const cardIds = [...c.cardIds];
          cardIds.splice(clampedIndex, 0, action.cardId);
          return { ...c, cardIds };
        });

        return { ...b, columns, ...touch() };
      });

    case "ADD_LABEL":
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        labels: [
          ...b.labels,
          { id: action.id, name: action.name, color: action.color },
        ],
        ...touch(),
      }));

    case "DELETE_LABEL":
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        labels: b.labels.filter((l) => l.id !== action.labelId),
        cards: Object.fromEntries(
          Object.entries(b.cards).map(([id, card]) => [
            id,
            {
              ...card,
              labelIds: card.labelIds.filter((l) => l !== action.labelId),
            },
          ]),
        ),
        ...touch(),
      }));

    case "REPLACE_STATE":
      return action.state;

    case "CLEAR_ALL":
      return createEmptyState();

    default:
      return state;
  }
}

export type { Priority };
