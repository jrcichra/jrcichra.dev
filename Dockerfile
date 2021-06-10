
FROM ubuntu:21.04
RUN apt-get update && apt-get install -y ruby-full build-essential zlib1g-dev ca-certificates \
	&& rm -rf /var/lib/dpkg
EXPOSE 8080
WORKDIR /src
RUN gem install jekyll bundler
COPY . .
CMD jekyll serve --host 0.0.0.0
