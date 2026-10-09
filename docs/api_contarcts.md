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


22. POST /api/evaluations

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