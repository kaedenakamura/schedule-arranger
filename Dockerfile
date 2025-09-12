# ベースイメージ
FROM node:22.15.0-slim

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
  git \
  locales \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && localedef -i ja_JP -c -f UTF-8 -A /usr/share/locale/locale.alias ja_JP.UTF-8

# 環境変数
ENV LANG ja_JP.utf8
ENV TZ=Asia/Tokyo

# 作業ディレクトリ
WORKDIR /app

# package.json と yarn.lock をコピーして依存関係をインストール
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# アプリのソースをコピー
COPY . /app

# ポートを明示
EXPOSE 3000

# サーバ起動
CMD ["node", "server.js"]
