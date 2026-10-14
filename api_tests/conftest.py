# Import pytest to define fixtures
import pytest

# Import the session factory that logs every request and response
from api_utils.api_client import create_api_session


# Provide each test with a logging HTTP session and close it afterwards
@pytest.fixture
def api_session():
    session = create_api_session()
    yield session
    session.close()
