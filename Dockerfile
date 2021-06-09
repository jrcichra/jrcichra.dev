FROM jekyll
WORKDIR /srv/jekyll
RUN gem install jekyll jekyll-gist jekyll-sitemap jekyll-seo-tag
RUN gem update --system && gem install bundler
COPY . .
RUN bundle install
CMD bundle exec jekyll serve --host 0.0.0.0
