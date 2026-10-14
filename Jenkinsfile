// Runs the EvalForge API (pytest) and UI (Playwright) test suites on the local Jenkins agent.
// Prerequisite: the EvalForge API and UI must already be running on this Mac.
pipeline {
    agent any

    parameters {
        // Local defaults work when Jenkins and the training application run on the same Mac.
        string(name: 'API_BASE_URL', defaultValue: 'http://localhost:3000', description: 'Reachable EvalForge API URL')
        string(name: 'UI_BASE_URL', defaultValue: 'http://localhost:5173', description: 'Reachable EvalForge UI URL')
    }

    environment {
        // Tells Playwright it is running in CI, which enables one retry (see playwright.config.ts)
        CI = 'true'

        // API address used by the pytest suite
        EVALFORGE_BASE_URL = "${params.API_BASE_URL}"

        // UI address used by the health check and the EvaluationPage page object
        APP_URL = "${params.UI_BASE_URL}"

        // Never try to open the HTML report in a browser on the build machine
        PLAYWRIGHT_HTML_OPEN = 'never'

        // Where the Playwright JUnit reporter writes its results
        PLAYWRIGHT_JUNIT_OUTPUT_NAME = 'reports/ui-results.xml'
    }

    options {
        // Stop runaway builds instead of letting them hang forever
        timeout(time: 20, unit: 'MINUTES')

        // Keep the last 20 builds so old reports do not fill the disk
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Check app is running') {
            steps {
                // Fail fast with a clear message instead of letting every test time out
                sh '''
                    curl -fsS -o /dev/null "$EVALFORGE_BASE_URL/api/datasets" \
                        || { echo "EvalForge API is not reachable at $EVALFORGE_BASE_URL. Start the app with 'npm run dev'."; exit 1; }
                    curl -fsS -o /dev/null "$APP_URL" \
                        || { echo "EvalForge UI is not reachable at $APP_URL. Start the app with 'npm run dev'."; exit 1; }
                '''
            }
        }

        stage('Install dependencies') {
            steps {
                // Python packages for the API tests, isolated in a virtual environment
                sh '''
                    python3 -m venv .venv
                    .venv/bin/pip install --quiet -r requirements.txt
                '''

                // Install the locked Node packages and the Chromium browser used by Playwright.
                sh '''
                    npm ci
                    npx playwright install chromium
                '''
            }
        }

        stage('API tests') {
            steps {
                // Mark the build failed if tests fail, but keep going so UI tests and reports still run.
                // pytest.ini writes reports/api-results.xml and reports/api-report.html.
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '.venv/bin/pytest api_tests'
                }
            }
        }

        stage('UI tests') {
            steps {
                // list = readable console log, junit = results for Jenkins, html = playwright-report/
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh 'npx playwright test --reporter=list,junit,html'
                }
            }
        }
    }

    post {
        always {
            // Show pass/fail results and trends on the build page
            junit testResults: 'reports/*.xml', allowEmptyResults: true

            // Keep the HTML reports, screenshots, and traces so failures can be investigated later
            archiveArtifacts artifacts: 'reports/**, playwright-report/**, test-results/**',
                             allowEmptyArchive: true
        }
    }
}
