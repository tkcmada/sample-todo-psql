# Tailwind CSS ハンズオン教材 (5時間コース)

## ゴール
- Tailwind CSS の基本的な使い方を理解する
- よく使うユーティリティクラスを習得する
- レスポンシブ対応やカスタマイズを体験する
- 1ページのシンプルな LP (ランディングページ) を完成させる

---

## 0. 導入 (15分)

### サンプルコード
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8">
  <h1 class="text-2xl font-bold">Hello Tailwind!</h1>
</body>
</html>
```

### 解説
- `p-8` : 内側余白 2rem (=32px)  
  - **単位の基礎**: Tailwind の数値スケールは `1単位 = 0.25rem`。1rem = 通常16px。`p-4` は1rem、`p-8` は2rem。
- `text-2xl` : 文字サイズ (約24px)  
  - **関連:** `text-sm` (14px), `text-base` (16px 標準), `text-xl` (20px), `text-3xl` (30px)
- `font-bold` : 太字  
  - **関連:** `font-light` (細字), `font-medium` (やや太い), `font-black` (極太), `italic` (斜体), `not-italic` (斜体を戻す)

---

## 1時間目：基本スタイル

### サンプルコード
```html
<div class="max-w-sm mx-auto bg-white rounded-lg shadow p-6">
  <img src="https://via.placeholder.com/100" class="w-24 h-24 mx-auto rounded-full">
  <h2 class="text-xl font-bold mt-4 text-center">山田 太郎</h2>
  <p class="text-gray-600 text-center mt-2 italic">フロントエンドエンジニア。猫好き。</p>
</div>
```

### 解説
- `max-w-sm`: 最大幅 24rem (384px)  
  - **関連:** `max-w-xs` (20rem), `max-w-md` (28rem), `max-w-full` (100%)
- `mx-auto`: 左右マージン自動 → 中央寄せ  
  - **関連:** `my-auto` (上下中央揃え), `mt-4` (上マージン1rem), `mb-2` (下マージン0.5rem)
- `bg-white`: 背景白  
  - **関連:** `bg-gray-100` (薄灰色), `bg-blue-500` (青), `bg-transparent` (透明)
- `rounded-lg`: 角を大きく丸める  
  - **関連:** `rounded-sm`, `rounded-xl`, `rounded-full`
- `shadow`: 影  
  - **関連:** `shadow-sm`, `shadow-md`, `shadow-none`
- `p-6`: padding 1.5rem (=24px)
- `w-24 h-24`: 幅・高さを6rem (=96px)
- `rounded-full`: 画像を円形に
- `text-xl`: 文字大 (20px)
- `font-bold`: 太字
- `italic`: 斜体
- `text-gray-600`: 灰色文字
- `text-center`: 中央寄せ

---

## 2時間目：ボタンとナビゲーション

### Flexboxとは？
- `flex` を指定すると「Flexboxコンテナ」になり、中の要素を横並び・整列できる。  
- **関連:** `inline-flex` はインライン表示のFlexbox。

### サンプルコード
```html
<header class="flex justify-between items-center p-4 bg-gray-800 text-white">
  <div class="font-bold text-lg">MySite</div>
  <nav class="space-x-4">
    <a href="#" class="hover:text-gray-300">Home</a>
    <a href="#" class="hover:text-gray-300">Services</a>
    <a href="#" class="hover:text-gray-300">Contact</a>
    <button class="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 transition">
      お問い合わせ
    </button>
  </nav>
</header>
```

### 解説
- `flex`: Flexboxコンテナ
- `justify-between`: 両端揃え  
  - **関連:** `justify-start`, `justify-center`, `justify-end`, `justify-around`, `justify-evenly`
- `items-center`: 縦中央揃え  
  - **関連:** `items-start`, `items-end`, `items-stretch`
- `p-4`: padding 1rem
- `bg-gray-800`: 背景濃灰
- `text-white`: 白文字
- `space-x-4`: 子要素の間に横1rem  
  - **関連:** `space-y-4` (縦間隔)
- `hover:text-gray-300`: ホバーで文字色変更
- `bg-blue-500`: 青背景
- `px-4 py-2`: 横1rem, 縦0.5rem
- `rounded`: 標準の角丸
- `hover:bg-blue-600`: ホバーで濃い青
- `active:bg-blue-700`: 押下時さらに濃い青
- `transition`: 状態変化を滑らかに  
  - **関連:** `duration-300` (300ms), `ease-in-out` (加速減速)

---

## 3時間目：カードレイアウトとレスポンシブ

### Gridとは？
- `grid` を指定すると「Gridコンテナ」になり、要素を格子状に配置できる。  
- **関連:** `inline-grid` はインライン表示のGrid。

### サンプルコード
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white shadow rounded overflow-hidden">
    <img src="https://via.placeholder.com/400x200" class="w-full object-cover aspect-video">
    <div class="p-4">
      <h3 class="font-bold text-lg">サービスA</h3>
      <p class="text-gray-600">説明文が入ります。</p>
    </div>
  </div>
</div>
```

### 解説
- `grid`: Gridコンテナ
- `grid-cols-1`: 1列  
  - **関連:** `grid-cols-2`, `grid-cols-3`, `grid-cols-4`
- `md:grid-cols-3`: 幅768px以上で3列
- `gap-6`: 要素間1.5rem  
  - **関連:** `gap-x-4` (横間隔), `gap-y-8` (縦間隔)
- `bg-white`: 背景白
- `shadow`: 影
- `rounded`: 丸角
- `overflow-hidden`: はみ出し非表示
- `w-full`: 幅100%
- `object-cover`: 縦横比を保ちトリミング  
  - **関連:** `object-contain`, `object-fill`, `object-none`
- `aspect-video`: 16:9比率固定  
  - **関連:** `aspect-square`: 1:1
- `p-4`: 内側余白1rem
- `font-bold`: 太字
- `text-lg`: 文字サイズ大 (18px)
- `text-gray-600`: 灰色文字

---

## 4時間目：フォーム

### サンプルコード
```html
<form class="max-w-md mx-auto space-y-4">
  <input type="text" placeholder="お名前"
         class="border p-2 rounded w-full focus:ring focus:ring-blue-300">
  <input type="email" placeholder="メールアドレス"
         class="border p-2 rounded w-full focus:ring focus:ring-blue-300">
  <textarea placeholder="メッセージ"
            class="border p-2 rounded w-full focus:ring focus:ring-blue-300"></textarea>
  <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
    送信
  </button>
</form>
```

### 解説
- `max-w-md`: 最大幅 28rem
- `mx-auto`: 左右中央寄せ
- `space-y-4`: 縦に1remの隙間
- `border`: 枠線  
  - **関連:** `border-2`, `border-gray-300`, `border-dashed`
- `p-2`: padding 0.5rem
- `rounded`: 丸角
- `w-full`: 幅100%
- `focus:ring`: フォーカス時リング表示  
  - **関連:** `focus:outline-none`, `focus:border-blue-400`
- `focus:ring-blue-300`: 青リング
- `bg-blue-500`: ボタン青
- `hover:bg-blue-600`: ホバー時濃青
- `text-white`: 白文字

---

## 5時間目：アニメーションと仕上げ

### Tailwind Config (カスタマイズ)
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#1DA1F2',
      },
    },
  },
}
```
- `extend.colors.brand`: 独自色を追加 → `bg-brand` で使える

### ダークモード
```html
<div class="bg-white text-black dark:bg-gray-800 dark:text-white p-4">
  ダークモード対応
</div>
```
- `dark:bg-gray-800`: ダーク時背景灰色
- `dark:text-white`: ダーク時文字白

### トランジション (状態変化)
```html
<button class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-300 ease-in-out">
  ホバーで色が滑らかに変わる
</button>
```
- `transition`: 状態変化を滑らかに
- `duration-300`: 300ms
- `ease-in-out`: 加速減速

### アニメーション (常時動作)
```html
<div class="w-10 h-10 bg-green-500 rounded-full animate-bounce"></div>
```
- `animate-spin`: 回転  
- `animate-ping`: 拡大して消える波紋  
- `animate-bounce`: 跳ねる  
- `animate-pulse`: 点滅  

---

# まとめ

- **Flexbox/Grid**: コンテナで要素整列  
- **1rem = 16px** (通常)  
- **関連スタイルを理解することで応用可能**  
- **基本の流れ**  
  レイアウト (`flex/grid`) → サイズ (`w/h/m/p`) → 色 (`bg/text`) → 装飾 (`rounded/shadow`) → 状態 (`hover/focus`) → アニメーション  

このハンズオンを通して、シンプルなLPを完成させましょう 🚀
