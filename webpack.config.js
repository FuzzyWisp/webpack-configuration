const fs = require('fs');
const path = require('path');
const HTMLWedPackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const OptimizeCssAssetPlugin = require('optimize-css-assets-webpack-plugin');

/* Переменная, хранящая информацию о том, в каком режиме происходит сборка */
const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
/* массив, в котором хранятся имена файлов страниц. Генерируетсся с помощью функции */
const pages = fs.readdirSync(path.resolve(__dirname, 'src/pages')).filter(fileName => fileName.endsWith('.pug'));

/* постоянная оптимизации продакшен сборки */
const prodOptimizer = () => {
  const config = {
    splitChunks:{
      chunks: 'all'
    }
  }
  if (isProd){
    config.minimizer = [
      new OptimizeCssAssetPlugin(),
      new TerserWebpackPlugin()
    ]
  }
  return config;
}
/* функция для объявления лоадеров */
const cssLoader = (extra) => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        /* hmr(Hot Module Replacement) позволяет без перезагузки страницы видеть изменения в браузере */
        hmr: true,
        reloadAll: true
      },
  }, 
  'css-loader']  //порядок использования расширений справа налево

  if (extra){
    loaders.push(extra);
  }

  return loaders;
}
/* функция для заполнения массива плгинов */
const plugins = () => {
  
  const base = [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, 'src/static'),to: path.resolve(__dirname, 'dist/static') },
      // { from: path.resolve(__dirname, 'src/static/img'), to: path.resolve(__dirname, 'dist/static/img'), test: /\.(png|jpg|gif|svg)$/ },
      //{ from: path.resolve(__dirname, 'src/pages'), test: /\.pug$/, to: path.resolve(__dirname, "dist") }
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css'
    }),    
    ...pages.map(page => new HTMLWedPackPlugin(
      {
        template: path.resolve(__dirname, 'src/pages/', page),
        filename: page.replace(/\.pug$/, '.html'),
        inject: true,
        minify:{
          collapseWhitespace: isProd
        }
      }
    ))
  ]
  // if (isProd) {
  //   base.push(new BundleAnalyzerPlugin());
  // }
  return base;

}

module.exports = {
  /* опция контекст указывает на дирикторю в которо мы совершаем манипуляции, позволяя не указавать ее в пути */
  context: path.resolve(__dirname, 'src'),
  entry: {
    main: ['@babel/polyfill', './index.js']
  },
  output: {
    filename: '[name].[hash].js',                     // [name] берет имя от имени чанка входной точки(main)
    path: path.resolve(__dirname, 'dist')
  },
  /*     Объект resolve - настройка для упрошения работы с Webpack      */
  resolve:{
    /*
      объект extentions указывает на расширения, которые Webpack распознает сам
      по умолчанию это js и json. Можно задать любые расширения и это позволит
      не прописывать их в импортах в дальнейшем, указывая только названия файлов
    */
    extensions: ['.js', '.json'],
    /*      allias позволяет придумать названия для путей для более простого указания их (в config)? и в импортах     */
    alias: {
      '@': path.resolve(__dirname),
      '@src': path.resolve(__dirname, 'src'),
      '@dist': path.resolve(__dirname, 'dist')

    }
  },
  /*
    Оптимизация подгражаемого кода и библиотек. если Webpack обнаруживает, что какая то библиотека
    подгружается несколько раз на разных страницах, то он выносит ее в отдельный скрипт
  */
  optimization: prodOptimizer(),
  devServer: {
    index: 'form-elements.html',
    port: 9000,
    hot: isDev,
    overlay: {
      warnings: true,
      errors: true
    }
  },
  devtool: isDev ? 'source-map' : '',
  
  /*     plagins - массив для плагинов Webpack      */
  plugins: plugins(),
  module: {
    rules:[
      /* 
        Объект module принимает массив rules, в котрый записываются объекты
         указывающие на лоадеры. Данные файлы преднозначены для работы со
         всевозможными расширениями файлов. Имеют следующий вид:
      {
        test: /\.some$/            //RegExp, указывающее на расширение файла
        use: some-loader           //указание к использованию конкретного лоадера
      }
      */
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader:{
          loader: 'babel-loader',
          options:{            
           presets:['@babel/preset-env']
          }
        }
      },
      {
        test: /\.pug$/,
        use: 'pug-loader'
      },
      {
        test: /\.css$/,
        use: cssLoader()
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoader(extra = 'sass-loader')
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: ['file-loader']
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=\d+\.\d+\.\d+)?$/,
        use: ['file-loader']
      }
    ]
  }
}