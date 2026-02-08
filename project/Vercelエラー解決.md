# Vercelエラー解決方法

## エラー内容

```
sh: line 1: vite: command not found
Error: Command "vite build" exited with 127
```

## 原因

Vercelが自動的に`vite build`コマンドを実行しようとしていますが、このプロジェクトは静的サイトなのでビルドは不要です。

## 解決方法

### 方法1: vercel.jsonでビルドコマンドを無効化（推奨）

`vercel.json`に以下を追加（既に追加済み）：

```json
{
  "version": 2,
  "buildCommand": "",
  "outputDirectory": ".",
  ...
}
```

### 方法2: Vercelダッシュボードで設定

1. Vercelダッシュボード（https://vercel.com/dashboard）にアクセス
2. プロジェクト（`Joblens`）を選択
3. 「Settings」タブをクリック
4. 「General」セクションで以下を設定：
   - **Build Command**: （空欄にする、または削除）
   - **Output Directory**: `.`（現在のディレクトリ）
   - **Install Command**: （空欄にする）

### 方法3: package.jsonを確認

`package.json`に`build`スクリプトがある場合、削除または変更：

```json
{
  "scripts": {
    "build": "echo 'No build needed'"
  }
}
```

## 手順

### ステップ1: vercel.jsonを更新

`vercel.json`に`buildCommand: ""`を追加（既に追加済み）

### ステップ2: GitHubにプッシュ

```bash
cd "/Users/momokaiwasaki/Documents/AIエンジニア講座/7-3-2_Dify×Bolt.new"
git add project/vercel.json
git commit -m "Vercelビルドコマンドを無効化"
git push origin main
```

### ステップ3: Vercelの設定を確認

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「General」を確認
3. **Build Command**が空欄になっているか確認
4. 空欄でない場合は、空欄にして「Save」をクリック

### ステップ4: 再デプロイ

1. 「Deployments」タブをクリック
2. 最新のデプロイメントの「...」メニューから「Redeploy」を選択
3. または、GitHubへのプッシュで自動的に再デプロイが開始されます

## 確認事項

- [ ] `vercel.json`に`buildCommand: ""`が含まれている
- [ ] VercelダッシュボードでBuild Commandが空欄になっている
- [ ] Output Directoryが`.`または空欄になっている

## 代替案: GitHub Pagesを使用

Vercelで問題が解決しない場合、GitHub Pagesを使用：

1. GitHubリポジトリの「Settings」→「Pages」
2. Source: `main` branch, `/project` folder
3. Save

数分後、`https://momoka810.github.io/Joblens/`でアクセス可能

