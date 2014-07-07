FROM debian:jessie

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y varnish supervisor && \
    apt-get clean

ADD varnishd.conf /etc/supervisor/conf.d/varnishd.conf
ADD varnishncsa.conf /etc/supervisor/conf.d/varnishncsa.conf

ADD varnish_vcl.tar /etc/varnish

CMD ["/usr/bin/supervisord", "-n"]
