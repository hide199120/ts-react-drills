/**
 * R-09 ★★★ 再レンダーの最適化（React.memo / useCallback / useMemo）
 *
 * 【課題】 SelectableList の不要な再レンダーをなくす。
 * 下の実装は「動く」が、メモ欄に1文字入力するたびに全ての行（ItemRow）が再レンダーされる。
 * 動作は変えずに、以下を満たすように直すこと。
 *
 * - メモ欄に入力しても ItemRow は1つも再レンダーされない
 * - 行を選択したとき、再レンダーされるのは「選択が外れた行」と「新しく選択された行」だけ
 * - 並び替えボタン（「名前順」「価格順」）を押したときは並べ替えが行われる
 * - sortItems（重い処理のつもり）は items か並び順が変わったときだけ呼ばれる（メモ入力や選択では呼ばれない）
 *
 * テストでは ItemRow 内で呼ばれる onRender（props で受け取る）の回数を数えて検証する。
 *
 * 【ヒント】 React.memo / useCallback / useMemo、関数型アップデート
 *
 * 【面接で聞かれること】
 * - React が再レンダーする条件は？（state 更新・親の再レンダー・Context 変更）
 * - React.memo はどう比較する？（props の浅い比較 Object.is）
 * - useCallback を付けても子が memo されていなければ意味がないのはなぜ？
 * - 何でもメモ化すれば良い？（比較コスト・可読性。計測してから。React Compiler の登場）
 * - 「state を下に移す」「children として渡す」でメモ化せずに解決する方法
 */
import { useState } from "react";

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

export function ItemRow({ item, selected, onSelect, onRender }: ItemRowProps) {
  onRender?.(item.id);
  return (
    <li>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(item.id)}>
        {item.name}（¥{item.price}）
      </button>
    </li>
  );
}

interface SelectableListProps {
  items: Item[];
  sort?: (items: Item[], key: SortKey) => Item[];
  onRowRender?: (id: string) => void;
}

export function SelectableList({ items, sort = sortItems, onRowRender }: SelectableListProps) {
  const [memo, setMemo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const sorted = sort(items, sortKey);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div>
      <label>
        メモ
        <input value={memo} onChange={(e) => setMemo(e.target.value)} />
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
