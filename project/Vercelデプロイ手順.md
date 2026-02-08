# Vercelデプロイ手順

## エラー解決方法

### 問題の原因

Vercelでデプロイする際、以下の設定が必要です：
- Root Directoryの設定
- ビルドコマンドの設定（不要な場合もある）
- 静的ファイルの設定

## 解決方法

### 方法1: Vercelの設定を変更

#### 1. Vercelダッシュボードで設定

1. Vercelダッシュボード（https://vercel.com/dashboard）にアクセス
2. プロジェクト（`Joblens`）を選択
3. 「Settings」タブをクリック
4. 「General」セクションで以下を設定：
   - **Root Directory**: `project`
   - **Build Command**: （空欄のまま、または削除）
   - **Output Directory**: `.`（現在のディレクトリ）

#### 2. 再デプロイ

1. 「Deployments」タブをクリック
2. 最新のデプロイメントの「...」メニューから「Redeploy」を選択
3. または、GitHubに新しいコミットをプッシュ

### 方法2: vercel.jsonファイルを作成

プロジェクトルート（`7-3-2_Dify×Bolt.new`）に`vercel.json`を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "project/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/project/$1"
    }
  ]
}
```

または、`project`ディレクトリ内に`vercel.json`を作成（既に作成済み）：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 方法3: プロジェクト構造を変更

GitHubリポジトリのルートに`index.html`を配置する方法：

1. `project`ディレクトリの内容をリポジトリのルートに移動
2. または、VercelのRoot Directoryを`project`に設定

## 推奨手順

### ステップ1: Vercelの設定を確認

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「General」を確認
3. **Root Directory**が`project`になっているか確認

### ステップ2: vercel.jsonを追加

`project`ディレクトリに`vercel.json`を作成（既に作成済み）

### ステップ3: GitHubにプッシュ

```bash
cd "/Users/momokaiwasaki/Documents/AIエンジニア講座/7-3-2_Dify×Bolt.new"
git add project/vercel.json
git commit -m "Vercel設定ファイルを追加"
git push origin main
```

### ステップ4: 再デプロイ

Vercelが自動的に再デプロイを開始します。

## よくあるエラーと解決方法

### エラー: "Build Command failed"

**解決方法：**
- Build Commandを空欄にする
- または、`echo "No build needed"`を設定

### エラー: "404 Not Found"

**解決方法：**
- Root Directoryが`project`になっているか確認
- `vercel.json`の設定を確認

### エラー: "File not found"

**解決方法：**
- ファイルパスを確認（`/api_key.txt`など）
- `vercel.json`でルーティングを設定

## 確認方法

デプロイが成功したら：

1. Vercelダッシュボードで「Deployments」を確認
2. 緑色のチェックマークが表示されれば成功
3. 公開URLをクリックして動作確認

## 代替案: GitHub Pagesを使用

Vercelで問題が解決しない場合、GitHub Pagesを使用することもできます：

1. GitHubリポジトリの「Settings」→「Pages」
2. Source: `main` branch, `/project` folder
3. Save

数分後、`https://momoka810.github.io/Joblens/`でアクセス可能

