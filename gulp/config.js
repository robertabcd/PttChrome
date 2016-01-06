var dest = './build';
var src = './src';

module.exports = {
  sass: {
    src: src + '/styles/**/*.{sass,scss,css}',
    dest: dest + '/css',
    settings: {
      includePaths: ['./bower_components/bootstrap-sass/assets/stylesheets'],
      outputStyle: 'compressed',
      indentedSyntax: false, // Enable .sass syntax?
      imagePath: '/images'  // Used by the image-url helper
    }
  },
  watch: {
    src: 'src/**/*.*',
    tasks: ['build']
  }
};

