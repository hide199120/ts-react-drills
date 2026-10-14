/**
 * R-07 ★★ useReducer と型付き Action（ショッピングカート）
 *
 * 【課題】
 * 1. CartAction 型を定義する（判別可能なユニオン）
 *    - { type: "add"; product: Product }           同じ商品がすでにあれば quantity を +1、なければ quantity 1 で追加
 *    - { type: "remove"; productId: string }       その商品をカートから消す
 *    - { type: "setQuantity"; productId: string; quantity: number }
 *                                                  数量を変更。0 以下なら商品を消す
 *    - { type: "clear" }                            空にする
 *
 * 2. cartReducer(state, action)  純粋関数として実装する（state を変更しない）
 *
 * 3. selectTotalPrice(state) / selectTotalCount(state)  合計金額・合計点数
 *
 * 4. Cart コンポーネント（props: products）
 *    - 各商品に「{商品名}をカートに追加」ボタン（aria-label）
 *    - カートは <ul aria-label="カート">（空でも表示）。中の商品を <li> で「{商品名} × {数量}」と表示
 *    - カート内の各商品に「{商品名}を減らす」ボタン（aria-label）。数量 -1、0 になったら消える
 *    - 「合計: ¥{金額}」（toLocaleString で 3 桁区切り）と「{点数}点」を表示
 *    - 「カートを空にする」ボタン
 *
 * 【面接で聞かれること】
 * - useState と useReducer の使い分け
 * - reducer を純粋関数にする理由（テスト容易性、予測可能性、StrictMode で2回呼ばれる）
 * - Redux との関係。Redux Toolkit / Zustand は何を解決する？
 */

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

// TODO
export type CartAction = { type: string };

export function cartReducer(state: CartState, action: CartAction): CartState {
  throw new Error("TODO");
}

export function selectTotalPrice(state: CartState): number {
  throw new Error("TODO");
}

export function selectTotalCount(state: CartState): number {
  throw new Error("TODO");
}

export function Cart(props: { products: Product[] }) {
  // TODO
  return null;
}
