
FROM ubuntu:latest

RUN apt-get update && apt-get install -y ruby-full build-essential zlib1g-dev \
	&& rm -rf /var/lib/dpkg

RUN groupadd -g 1000 jekyll && useradd -g 1000 -m -u 1000 jekyll && mkdir /src /opt/gems && chown jekyll:jekyll /opt/gems

USER jekyll

ENV GEM_HOME /opt/gems

EXPOSE 8080
VOLUME /src
WORKDIR /src

RUN gem install jekyll bundler jekyll-gist jekyll-sitemap jekyll-seo-tag
RUN bundle install

COPY . .

ENTRYPOINT /opt/gems/bin/jekyll
CMD serve --host 0.0.0.0
