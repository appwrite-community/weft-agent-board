import { useBoard } from './board-context';

export function BoardHeader() {
  const { board, cards } = useBoard();
  return (
    <div className="flex h-16 shrink-0 flex-col justify-center px-5 pt-1">
      <h1 className="truncate text-20 font-semibold tracking-[-0.015em]">{board.name}</h1>
      <p className="mt-1 truncate text-13 text-muted">
        {board.description}
        {board.description && <span className="text-[#46464d]"> · </span>}
        <span className="tabular">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </span>
      </p>
    </div>
  );
}
