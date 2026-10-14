EvalForge — API Contracts

Base URL: http://localhost:3000

1. GET /api/datasets

Purpose: Retrieve available evaluation datasets.

Request

Method: GET

Endpoint: /api/datasets

Request body: None

Success Response: 200 OK

{
  "datasets": [
    {
      "id": "order-agent-basics",
      "name": "Order Agent Basics",
      "description": "Six deterministic e-commerce order scenarios",
      "scenarioCount": 6
    }
  ]
}

.............................................................................
2. POST /api/evaluations

Purpose: Create a new evaluation run.

Request

Method: POST

Endpoint: /api/evaluations

Content-Type: application/json

Request Body:

{
  "datasetId": "order-agent-basics",
  "agentId": "deterministic-order-agent-v1"
}

Response

Status Code: 202 Accepted

Content-Type: application/json

Location: /api/evaluations/{runId}

Response Body:

{
  "run": {
    "id": "<generated-run-id>",
    "datasetId": "order-agent-basics",
    "agentId": "deterministic-order-agent-v1",
    "status": "PENDING",
    "totalScenarios": 6,
    "passedCount": 0,
    "failedCount": 0,
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>",
    "results": []
  }
}

Response Fields

run: Object containing evaluation information

id: String — unique evaluation run ID

datasetId: String — dataset identifier

agentId: String — agent identifier

status: String — evaluation status

totalScenarios: Number — total scenarios

passedCount: Number — passed scenarios

failedCount: Number — failed scenarios

createdAt: String — creation timestamp

updatedAt: String — last update timestamp

results: Array — individual scenario results

Evaluation Statuses

PENDING — Waiting for processing

RUNNING — Processing

COMPLETE — Processing finished

FAILED — Processing error

Note: The API processes evaluations asynchronously. 202 Accepted does not mean the evaluation has finished.


........................................................

3. GET /api/evaluations/{runId}

Purpose: Retrieve an evaluation run and its results.

Request

Method: GET

Endpoint: /api/evaluations/{runId}

Request Body: None

Path Parameter: runId — unique evaluation ID

Response

Status Code: 200 OK

Content-Type: application/json

Example Response (abbreviated):

{
  "run": {
    "id": "<generated-run-id>",
    "datasetId": "order-agent-basics",
    "agentId": "deterministic-order-agent-v1",
    "status": "COMPLETE",
    "totalScenarios": 6,
    "passedCount": 6,
    "failedCount": 0,
    "results": [
      {
        "scenarioId": "cancel-by-id",
        "scenarioName": "Cancel order by ID",
        "input": "Cancel order 123.",
        "expected": {
          "tool": "cancelOrder",
          "parameters": {"orderId": "123"},
          "outcome": "SUCCESS"
        },
        "actual": {
          "tool": "cancelOrder",
          "parameters": {"orderId": "123"},
          "outcome": "SUCCESS",
          "response": "Order 123 was cancelled."
        },
        "passed": true,
        "explanation": "PASS: correct tool, parameters, and success outcome."
      }
    ]
  }
}

Response Fields

run.id: String — evaluation ID

run.status: String — current processing status

run.totalScenarios: Number — total scenarios

run.passedCount: Number — passed scenarios

run.failedCount: Number — failed scenarios

run.results: Array — scenario results

results[].expected: Object — expected agent behavior

results[].actual: Object — actual agent behavior

results[].passed: Boolean — whether the scenario passed

Note: The example shows one of six results. Actual results vary by evaluation run.

.................................

Error Response — Missing Required Fields

Condition: datasetId or agentId is missing.

HTTP Status: 400 Bad Request

Error Response:

{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "datasetId and agentId are required",
    "correlationId": "<generated-correlation-id>"
  }
}

Response Fields:

error.code: String — error identifier

error.message: String — explanation of the error

error.correlationId: String — request tracking ID
