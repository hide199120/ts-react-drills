/**
 * R-07 模範解答
 *
 * ポイント
 * - Action を判別可能なユニオンにすると、switch の各 case で action のプロパティが正しく絞り込まれる
 * - reducer は「(今の状態, 起きたこと) => 次の状態」の純粋関数。React に依存しないので単体テストが楽
 * - 合計などの派生値は state に持たず selector 関数で計算する
 * - コンポーネントは dispatch するだけになり、「何が起きたか」と「どう状態が変わるか」が分離される
 */
import { useReducer } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "clear" };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const exists = state.items.some((i) => i.id === action.product.id);
      return {
        items: exists
          ? state.items.map((i) => (i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...state.items, { ...action.product, quantity: 1 }],
      };
    }
    case "remove":
      return { items: state.items.filter((i) => i.id !== action.productId) };
    case "setQuantity":
      if (action.quantity <= 0) {
        return cartReducer(state, { type: "remove", productId: action.productId });
      }
      return {
        items: state.items.map((i) => (i.id === action.productId ? { ...i, quantity: action.quantity } : i)),
      };
    case "clear":
      return { items: [] };
  }
}

export function selectTotalPrice(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function selectTotalCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}

export function Cart({ products }: { products: Product[] }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });

  return (
    <div>
      <section>
        <h2>商品</h2>
        {products.map((p) => (
          <div key={p.id}>
            {p.name}（¥{p.price.toLocaleString()}）
            <button type="button" aria-label={`${p.name}をカートに追加`} onClick={() => dispatch({ type: "add", product: p })}>
              追加
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>カート</h2>
        <ul aria-label="カート">
          {cart.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <button
                type="button"
                aria-label={`${item.name}を減らす`}
                onClick={() => dispatch({ type: "setQuantity", productId: item.id, quantity: item.quantity - 1 })}
              >
                −
              </button>
            </li>
          ))}
        </ul>
        <p>合計: ¥{selectTotalPrice(cart).toLocaleString()}</p>
        <p>{selectTotalCount(cart)}点</p>
        <button type="button" onClick={() => dispatch({ type: "clear" })}>
          カートを空にする
        </button>
      </section>
    </div>
  );
}
