# Import the library used to send HTTP requests
from pdb import run

import requests

# Import our reusable polling function
from api_utils.polling import wait_for_evaluation_complete

# Import pytest to use parameterization
import pytest

# Access environment variables
import os

# Default to the local API unless another environment is configured
BASE_URL = os.getenv("EVALFORGE_BASE_URL", "http://localhost:3000")


# pytest recognizes functions beginning with test_
def test_create_evaluation():

    # Prepare the JSON request body
    payload = {
        "datasetId": "order-agent-basics",
        "agentId": "deterministic-order-agent-v1"
    }

    # Send a POST request to create an evaluation
    response = requests.post(
        f"{BASE_URL}/api/evaluations",
        json=payload,
        timeout=10
    )

    # Verify the API accepted the request
    assert response.status_code == 202

    # Convert the JSON response into a Python dictionary
    body = response.json()

    # Verify the response contains a run object
    assert "run" in body

    # Extract the evaluation run
    run = body["run"]

    # Verify a nonempty run ID was generated
    assert isinstance(run["id"], str)
    assert len(run["id"]) > 0

    # Verify the returned IDs match our request
    assert run["datasetId"] == payload["datasetId"]
    assert run["agentId"] == payload["agentId"]

    # Verify the initial evaluation status
    assert run["status"] == "PENDING"


    # Capture the generated evaluation ID
    run_id = run["id"]

# Poll the API until processing completes
    completed_run = wait_for_evaluation_complete(run_id)

# Verify the final processing status
    assert completed_run["status"] == "COMPLETE"

# Verify that six scenarios were evaluated
    assert completed_run["totalScenarios"] == 6

# Verify that all scenarios have a recorded outcome
    assert (
        completed_run["passedCount"] + completed_run["failedCount"]
        == completed_run["totalScenarios"]
    )
    

# Verify that six individual scenario results were returned
    assert len(completed_run["results"]) == 6


#############################

# Run the same test with three different invalid payloads
@pytest.mark.parametrize("payload", [
    {"agentId": "deterministic-order-agent-v1"},  # Missing datasetId
    {"datasetId": "order-agent-basics"},            # Missing agentId
    {}                                              # Missing both fields
])
def test_create_evaluation_missing_required_fields(payload):

    # Send the invalid payload to the API
    response = requests.post(
        f"{BASE_URL}/api/evaluations",
        json=payload,
        timeout=10
    )

    # Verify the API rejects the request
    assert response.status_code == 400

    # Extract the JSON response
    body = response.json()

    # Verify the expected error code
    assert body["error"]["code"] == "INVALID_REQUEST"

    # Verify the error message
    assert body["error"]["message"] == "datasetId and agentId are required"

#################################

# Verify that requesting an unknown evaluation returns 404
def test_get_evaluation_invalid_run_id():

    # Define an evaluation ID that does not exist
    run_id = "nonexistent-run-id"

    # Send a GET request using the invalid ID
    response = requests.get(
        f"{BASE_URL}/api/evaluations/{run_id}",
        timeout=10
    )

    # Verify that the API returns HTTP 404
    assert response.status_code == 404

    # Convert the JSON response into a Python dictionary
    body = response.json()

    # Verify the expected error code
    assert body["error"]["code"] == "RUN_NOT_FOUND"

    # Verify that the error message references our requested ID
    assert run_id in body["error"]["message"]

    # Verify that the correlation ID matches the response header
    assert body["error"]["correlationId"] == response.headers["x-correlation-id"] 