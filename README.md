# Dify × Bolt.new チャット連携

## セキュリティについて

⚠️ **重要**: フロントエンド（ブラウザ）のJavaScriptにAPIキーを直接書き込むことは、セキュリティリスクがあります。

### リスク
- ブラウザの開発者ツールで誰でもコードを確認できる
- ソースコードが公開される
- APIキーが悪用される可能性がある

### 推奨される使用方法

1. **開発・学習用途**: `api_key.txt`を使用（Gitにコミットしない）
2. **本番環境**: サーバーサイドでAPIキーを管理することを強く推奨

## セットアップ方法

### 1. DifyのAPIキーを取得

**はい、DifyのAPIキーを使用します。**

DifyのダッシュボードでAPIキーを取得してください：

1. Difyのダッシュボードにログイン
2. 左側のメニューから「設定」または「Settings」を選択
3. 「API Keys」または「APIキー」タブを開く
4. 「Create API Key」または「APIキーを作成」をクリック
5. 表示されたAPIキーをコピー（形式: `app-xxxxxxxxxxxxx`）

⚠️ **重要**: APIキーは一度しか表示されないため、必ずコピーして安全な場所に保存してください。

### 2. APIキーの設定（nanoエディタで編集）

```bash
# nanoエディタでapi_key.txtを開く
nano api_key.txt
```

`api_key.txt`にDifyのAPIキーを1行で記入してください：

```
app-xxxxxxxxxxxxx
```

保存方法：
- `Ctrl + O` で保存
- `Enter` で確認
- `Ctrl + X` で終了

### 3. Bolt.newで作成したHTMLファイルの配置

**Bolt.newで作成したHTMLファイルを直接配置するだけでOKです。GitHubのURLは不要です。**

1. Bolt.newで作成したHTMLファイルをダウンロード
2. このディレクトリ（`7-3-2_Dify×Bolt.new`）に配置
3. HTMLファイルの`<body>`の最後（`</body>`の直前）に、以下を追加：

```html
<!-- メインスクリプトを読み込む（api_key.txtは自動で読み込まれます） -->
<script src="script.js"></script>
```

**例：**
```html
<body>
    <!-- Bolt.newで作成した既存のHTML/CSS -->
    <div class="chat-container">
        <!-- ... -->
    </div>
    
    <!-- この行を追加 -->
    <script src="script.js"></script>
</body>
```

⚠️ **注意**: 既存のHTML/CSS構造は変更しないでください。`script.js`を読み込むだけで動作します。

## 使用方法

1. `api_key.txt`にAPIキーを設定（nanoで編集）✅ **完了済み**
2. Bolt.newで作成したHTMLファイルをこのディレクトリに配置
3. HTMLファイルの`<body>`の最後に`<script src="script.js"></script>`を追加
4. ローカルサーバーを起動してブラウザで開く
5. チャット入力欄にメッセージを入力して送信

## 注意事項

- `api_key.txt`は`.gitignore`に追加されているため、Gitにコミットされません
- 本番環境では、APIキーをサーバーサイドで管理することを推奨します
- `api_key.txt`は1行でAPIキーのみを記入してください（改行や余分な文字は自動で除去されます）
- ローカルファイルを直接開く場合、CORSエラーが発生する可能性があります。ローカルサーバーを使用することを推奨します：

```bash
# Python 3の場合
python3 -m http.server 8000

# Node.jsの場合（http-serverをインストール後）
npx http-server
```

その後、ブラウザで `http://localhost:8000` にアクセスしてください。

