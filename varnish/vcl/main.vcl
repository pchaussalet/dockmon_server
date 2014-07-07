include "backends.vcl";

sub vcl_recv {
  if (req.http.host ~ "auth\..*") {
    set req.backend = auth;
  } else if (req.http.host ~ "www\..*") {
    set req.backend = site;
  } else if (req.http.host ~ "dash\..*") {
    set req.backend = dash;
  } else if (req.http.host ~ "metrics\..*") {
    set req.backend = metrics;
  }
  return(pass);
}
