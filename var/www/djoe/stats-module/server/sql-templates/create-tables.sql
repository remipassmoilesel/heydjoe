CREATE TABLE IF NOT EXISTS data_requests (
  id  SERIAL PRIMARY KEY,
  datetime    TIMESTAMP DEFAULT now(),
  request_from    VARCHAR(15),
  event_name    TEXT,
  event_data    TEXT
);
