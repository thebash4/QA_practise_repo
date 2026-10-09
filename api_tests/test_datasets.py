# Import the requests library to make HTTP calls
import requests

# Access environment variables
import os

# Use localhost unless another API URL is provided
BASE_URL = os.getenv("EVALFORGE_BASE_URL", "http://localhost:3000")


# pytest discovers functions whose names begin with test_
def test_get_datasets():

    # Send an HTTP GET request to the Evaluation API
    response = requests.get(
        f"{BASE_URL}/api/datasets",
        timeout=10
    )

    # Verify that the API returns HTTP 200 OK
    assert response.status_code == 200

    # Convert the JSON response into a Python dictionary
    body = response.json()

# Verify that the response contains a "datasets" key
    assert "datasets" in body

# Verify that datasets is a list (JSON array)
    assert isinstance(body["datasets"], list)

# Verify that at least one dataset was returned
    assert len(body["datasets"]) > 0

    
    
    # Get the first dataset from the list
    dataset = body["datasets"][0]

# Verify that the dataset contains the expected fields
    assert "id" in dataset
    assert "name" in dataset
    assert "description" in dataset
    assert "scenarioCount" in dataset

# Verify the known training dataset's values
    assert dataset["id"] == "order-agent-basics"
    assert dataset["scenarioCount"] == 6