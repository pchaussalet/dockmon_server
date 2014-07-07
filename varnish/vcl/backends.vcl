backend auth {
  .host = "auth";
  .port = "9999";
}

backend metrics {
  .host = "metrics";
  .port = "9999";
}

backend dash {
  .host = "dash";
  .port = "80";
}

backend site {
  .host = "site";
  .port = "80";
}
