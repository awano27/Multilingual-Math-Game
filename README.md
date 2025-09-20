# Multilingual Math Game

## プロジェクト構成
- `math-game-complete.html`: 既存のスタンドアロン版（参考用）
- `math-dungeon-app/`: Vite + React + TypeScript + Tailwind CLI で構築した最新版

[パズルゲームを今すぐ遊ぶ](https://awano27.github.io/Multilingual-Math-Game/math-game-complete.html)

## ローカル開発
```bash
cd math-dungeon-app
npm install
npm run dev
```
ブラウザで http://localhost:5173 にアクセスするとゲームを確認できます。

## ビルド
```bash
cd math-dungeon-app
npm run build
```
`math-dungeon-app/dist/` に本番ビルド一式が生成されます。

## GitHub Pages へのデプロイ
1. 変更を `main` ブランチへ push します。
2. GitHub の **Settings > Pages** で “Build and deployment” を “GitHub Actions” に設定します。
3. `.github/workflows/deploy.yml` が自動で Vite ビルドを行い、`gh-pages` ブランチへ公開します。
   - GitHub Actions の **Deploy Vite app to GitHub Pages** ジョブが成功したことを確認してください。
4. 公開 URL は `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` になります。

> GitHub Actions 上では `vite.config.ts` がリポジトリ名をもとに `base` を自動設定します。ローカル開発では `/` ベースで動作します。

## Tailwind CLI
Tailwind CSS は CLI/JIT 構成です。ユーティリティクラスを追加した際は、`npm run dev` あるいは `npm run build` を実行するとスタイルに反映されます。