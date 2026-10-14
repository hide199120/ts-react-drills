/**
 * R-09 模範解答
 *
 * ポイント（3点セットで初めて効く）
 * 1. ItemRow を memo で包む → props が浅い比較で同じなら再レンダーをスキップ
 * 2. onSelect を useCallback で安定させる → 毎レンダー新しい関数だと memo の比較が常に「違う」になる
 *    setSelectedId は React が参照の安定を保証しているので依存配列は [] でよい
 *    （state を読む必要があるときも、関数型アップデートにすれば依存を増やさずに済む）
 * 3. sorted を useMemo → 毎回新しい配列・新しい item 参照が作られるのを防ぐ（＆重い計算をスキップ）
 *
 * - selected は boolean で渡しているので、選択に関係ない行の props は変わらない
 *   （selectedId を全行に渡すと、選択のたびに全行が再レンダーされてしまう）
 * - React Compiler を導入すると、こうしたメモ化を自動で入れてくれる。ただし仕組みの理解は面接で問われる
 */
import { memo, useCallback, useMemo, useState } from "react";

export interface Item {
  id: string;
  name: string;
  price: number;
}

export type SortKey = "name" | "price";

export function sortItems(items: Item[], key: SortKey): Item[] {
  return items.toSorted((a, b) => (key === "name" ? a.name.localeCompare(b.name) : a.price - b.price));
}

interface ItemRowProps {
  item: Item;
  selected: boolean;
  onSelect: (id: string) => void;
  onRender?: (id: string) => void;
}

export const ItemRow = memo(function ItemRow({ item, selected, onSelect, onRender }: ItemRowProps) {
  onRender?.(item.id);
  return (
    <li>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(item.id)}>
        {item.name}（¥{item.price}）
      </button>
    </li>
  );
});

interface SelectableListProps {
  items: Item[];
  sort?: (items: Item[], key: SortKey) => Item[];
  onRowRender?: (id: string) => void;
}

export function SelectableList({ items, sort = sortItems, onRowRender }: SelectableListProps) {
  const [memoText, setMemoText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const sorted = useMemo(() => sort(items, sortKey), [sort, items, sortKey]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <div>
      <label>
        メモ
        <input value={memoText} onChange={(e) => setMemoText(e.target.value)} />
      </label>
      <div>
        <button type="button" onClick={() => setSortKey("name")}>
          名前順
        </button>
        <button type="button" onClick={() => setSortKey("price")}>
          価格順
        </button>
      </div>
      <p>選択中: {items.find((i) => i.id === selectedId)?.name ?? "なし"}</p>
      <ul>
        {sorted.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onSelect={handleSelect}
            onRender={onRowRender}
          />
        ))}
      </ul>
    </div>
  );
}
