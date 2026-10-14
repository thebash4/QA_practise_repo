# Library for writing log messages that pytest captures per test
import logging

# Library for sending HTTP requests
import requests

# Logger used for every API request and response
logger = logging.getLogger("api")

# Limit logged bodies so large responses do not bloat the report
MAX_BODY_CHARS = 2000


# Shorten long text and mark that it was cut
def _truncate(text):
    if text and len(text) > MAX_BODY_CHARS:
        return text[:MAX_BODY_CHARS] + "...[truncated]"
    return text


# Write one request line and one response line at the given log level
def _log_exchange(response, level):
    request = response.request

    # Request bodies can be bytes, text, or empty
    body = request.body
    if isinstance(body, bytes):
        body = body.decode("utf-8", errors="replace")

    logger.log(level, "-> %s %s body=%s", request.method, request.url, _truncate(body))
    logger.log(
        level,
        "<- %s in %.0fms correlationId=%s body=%s",
        response.status_code,
        response.elapsed.total_seconds() * 1000,
        response.headers.get("x-correlation-id"),
        _truncate(response.text),
    )


# Response hook that logs every exchange at INFO level
def log_exchange(response, *args, **kwargs):
    _log_exchange(response, logging.INFO)


# Response hook for frequent calls such as polling, logged at DEBUG to reduce noise
def log_exchange_quietly(response, *args, **kwargs):
    _log_exchange(response, logging.DEBUG)


# Create a session that logs every request and response automatically
def create_api_session():
    session = requests.Session()
    session.hooks["response"].append(log_exchange)
    return session
