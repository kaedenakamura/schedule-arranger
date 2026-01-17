# Schedule Arranger (スケジュール調整表)

予定調整のためのWebアプリケーションです。

## 機能

- GitHub認証によるログイン
- スケジュールの作成と管理
- 候補日時への出欠登録
- コメント機能

## 技術スタック

- Node.js (v22.15.0以上)
- Hono (Webフレームワーク)
- Prisma (ORM)
- PostgreSQL (データベース)
- React (フロントエンド)
- Bootstrap (UIフレームワーク)

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、必要な値を設定してください。

```bash
cp .env.example .env
```

`.env`ファイルを編集して以下の値を設定：

- `DATABASE_URL`: PostgreSQLの接続URL
- `SESSION_PASSWORD`: セッション管理用の秘密鍵（32文字以上）
- `GITHUB_CLIENT_ID`: GitHub OAuthアプリのClient ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuthアプリのClient Secret
- `CSRF_TRUSTED_ORIGIN`: アプリのオリジンURL

#### GitHub OAuthアプリの作成

1. https://github.com/settings/developers にアクセス
2. "New OAuth App"をクリック
3. 以下の情報を入力：
   - Application name: Schedule Arranger (任意)
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github`
4. Client IDとClient Secretを`.env`に設定

### 3. データベースのセットアップ

PostgreSQLサーバーを起動してから：

```bash
# Prismaのマイグレーション実行
npx prisma migrate dev

# または既存のデータベースにスキーマを適用
npx prisma db push
```

### 4. フロントエンドのビルド

```bash
npx webpack
```

### 5. アプリの起動

```bash
npm start
```

アプリは `http://localhost:3000` で起動します。

## Dockerでの起動

Docker Composeを使用して起動することもできます：

```bash
docker-compose up -d
```

## 開発

### テストの実行

```bash
npm test
```

### Webpackの監視モード

```bash
npx webpack --watch
```
