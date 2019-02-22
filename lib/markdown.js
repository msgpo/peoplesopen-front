const data = require('gulp-data');
const frontMatter = require('front-matter');
const fs = require('fs');
const gulp = require('gulp');
const marked = require('marked');
const Path = require('path');
const rename = require('gulp-rename');
const Twig = require('twig');
// Disable twig cache so that re-renders work during a gulp watch
Twig.cache(false);
const Yaml = require('js-yaml');

const twigRender = (tpl, twigData) => {
  const twig = Twig.twig;
  const file = Path.join('.', 'templates', `${tpl}.twig`);
  const options = { path: file, async: false };
  const template = twig(options);
  return template.render(twigData);
};

const htmlTitle = (config, content) => {
  const siteName = config.site_name;
  const pageTitle = content.attributes.title;

  if (content.attributes.html_title) {
    return content.attributes.html_title;
  }

  const title = (pageTitle) ? `${pageTitle} | ${siteName}` : siteName;

  return title;
};

const renderedPageBody = (content) => {
  const layout = Path.join('layout', (content.attributes.layout || 'default'));
  const options = {
    page: content.attributes,
    body: content.body ? marked(content.body) : '',
  };
  return twigRender(layout, options);
};

const twigData = (config, file) => {
  const content = frontMatter(String(file.contents));
  content.attributes.site_name = config.site_name;
  return {
    html_title: String(htmlTitle(config, content)),
    html_description: content.attributes.description || config.description || '',
    html_keywords: content.attributes.keywords || config.keywords || '',
    page: content.attributes || {},
    body: renderedPageBody(content),
  };
};

const renderedFile = (config, file) => twigRender('html', twigData(config, file));

module.exports = () => {
  const config = Yaml.safeLoad(fs.readFileSync(Path.join('.', 'config.yml')));
  return gulp.src(['./src/**/*.md'])
    .pipe(data((file) => {
      file.contents = Buffer.from(String(renderedFile(config, file)));
      return file;
    }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('./web', { mode: 'string' }));
};
