# Library for measuring elapsed time
import time

# Access environment variables
import os

# Log polling calls at DEBUG so repeated status checks do not flood the report
from api_utils.api_client import log_exchange_quietly

# Use localhost by default, or the configured API URL
BASE_URL = os.getenv("EVALFORGE_BASE_URL", "http://localhost:3000")


# Reusable function for waiting until an evaluation finishes
def wait_for_evaluation_complete(session, run_id, timeout=30):

    # Record when polling started
    start_time = time.monotonic()

    # Keep checking until we return or reach the timeout
    while time.monotonic() - start_time < timeout:

        # Retrieve the latest evaluation status
        # Construct the evaluation endpoint using the configured base URL
        # The per-request hook replaces the session's INFO logger for this call
        response = session.get(
            f"{BASE_URL}/api/evaluations/{run_id}",
            timeout=10,
            hooks={"response": [log_exchange_quietly]}
        )

        # Verify that the GET request succeeded
        response.raise_for_status()

        # Extract the evaluation run
        run = response.json()["run"]

        # Return when processing finishes
        if run["status"] == "COMPLETE":
            return run

        # Report a processing failure immediately
        if run["status"] == "FAILED":
            raise AssertionError(
                f"Evaluation {run_id} failed: {run}"
            )

        # Wait briefly before checking again
        time.sleep(0.5)

    # Fail if processing never finishes
    raise TimeoutError(
        f"Evaluation {run_id} did not complete within {timeout} seconds"
    )
