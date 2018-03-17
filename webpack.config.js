// webpack の設定ファイル
// webpackモジュールをインストールして
// 'node_modules/.bin/webpack'
// でバンドルされる
module.exports = {
  // クライアントの(ひとまとめにしたい？)JavaScriptが含まれるディレクトリ
  context: __dirname + '/app',
  // 依存関係の最初の入口となるファイル(.js)は省略
  // これを実行するの必要なJavaScriptがひとまとめになる
  entry: './entry',
  // バンドルファイルの出力先設定
  output: {
    path: __dirname + '/public/javascripts',
    filename: 'bundle.js'
  }
};
