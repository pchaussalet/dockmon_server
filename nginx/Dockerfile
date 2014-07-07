FROM debian:jessie

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx-light && \
    mkdir /var/www && chown www-data /var/www && \
    apt-get clean

ADD default   /etc/nginx/sites-enabled/default
ADD nginx.sh  /usr/local/bin/nginx.sh

ONBUILD ADD . /var/www

EXPOSE 80

CMD "/usr/local/bin/nginx.sh"
