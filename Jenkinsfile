// Runs a selected EvalForge Playwright suite or the legacy pytest suite on the local Jenkins agent.
// Prerequisite: the services required by the selected suite must already be running on this Mac.
pipeline {
    agent any

    parameters {
        // Local defaults work when Jenkins and the training application run on the same Mac.
        string(name: 'API_BASE_URL', defaultValue: 'http://localhost:3000', description: 'Reachable EvalForge API URL')
        string(name: 'UI_BASE_URL', defaultValue: 'http://localhost:5173', description: 'Reachable EvalForge UI URL')
        choice(name: 'TEST_SUITE',
               choices: ['setup-validation', 'smoke', 'api', 'all', 'legacy-pytest'],
               description: 'Test suite to execute; legacy-pytest is excluded from Playwright runs')
        choice(name: 'WORKERS',
               choices: ['1', '3', '6'],
               description: 'Parallel workers for Playwright suites; ignored by legacy-pytest')
    }

    environment {
        // Tells Playwright it is running in CI, which enables one retry (see playwright.config.ts)
        CI = 'true'

        // API address shared by Playwright API fixtures and the legacy pytest suite
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
                // Every supported suite needs the public Evaluation API; only UI-capable suites need the frontend.
                sh '''
                    curl -fsS -o /dev/null "$EVALFORGE_BASE_URL/health" \
                        || { echo "EvalForge API is not reachable at $EVALFORGE_BASE_URL. Start the app with 'npm run dev'."; exit 1; }

                    if [ "$TEST_SUITE" = 'smoke' ] || [ "$TEST_SUITE" = 'all' ]; then
                        curl -fsS -o /dev/null "$APP_URL" \
                            || { echo "EvalForge UI is not reachable at $APP_URL. Start the app with 'npm run dev'."; exit 1; }
                    fi
                '''
            }
        }

        stage('Install legacy Python dependencies') {
            when {
                expression { params.TEST_SUITE == 'legacy-pytest' }
            }
            steps {
                // Keep the learning-only pytest stack isolated and install it only when explicitly selected.
                sh '''
                    python3 -m venv .venv
                    .venv/bin/pip install --quiet -r requirements.txt
                '''
            }
        }

        stage('Install Playwright dependencies') {
            when {
                expression { params.TEST_SUITE != 'legacy-pytest' }
            }
            steps {
                // API-only suites do not need a browser binary; UI-capable suites install Chromium.
                sh '''
                    npm ci

                    if [ "$TEST_SUITE" = 'smoke' ] || [ "$TEST_SUITE" = 'all' ]; then
                        npx playwright install chromium
                    fi
                '''
            }
        }

        stage('Legacy Python API tests') {
            when {
                expression { params.TEST_SUITE == 'legacy-pytest' }
            }
            steps {
                // pytest.ini writes reports/api-results.xml and reports/api-report.html.
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        set +e
                        COLLECTION_OUTPUT=$(.venv/bin/pytest --collect-only -q api_tests 2>&1)
                        COLLECTION_STATUS=$?
                        set -e
                        printf '%s\n' "$COLLECTION_OUTPUT"

                        if [ "$COLLECTION_STATUS" -eq 5 ]; then
                            echo 'No legacy pytest tests were collected; failing the build instead of reporting a false success.'
                            exit 1
                        fi
                        if [ "$COLLECTION_STATUS" -ne 0 ]; then
                            echo 'Legacy pytest collection failed.'
                            exit "$COLLECTION_STATUS"
                        fi

                        .venv/bin/pytest api_tests
                    '''
                }
            }
        }

        stage('Playwright tests') {
            when {
                expression { params.TEST_SUITE != 'legacy-pytest' }
            }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        # Convert the controlled choice into fixed Playwright arguments without eval.
                        case "$TEST_SUITE" in
                            setup-validation)
                                set -- --grep '@setup-validation'
                                ;;
                            smoke)
                                set -- --grep '@smoke'
                                ;;
                            api)
                                set -- tests/api/
                                ;;
                            all)
                                set --
                                ;;
                            *)
                                echo "Unsupported Playwright suite: $TEST_SUITE"
                                exit 2
                                ;;
                        esac

                        # Discovery makes an empty tag or directory selection an explicit build failure.
                        set +e
                        DISCOVERY_OUTPUT=$(npx playwright test "$@" --list 2>&1)
                        DISCOVERY_STATUS=$?
                        set -e
                        printf '%s\n' "$DISCOVERY_OUTPUT"

                        if [ "$DISCOVERY_STATUS" -ne 0 ]; then
                            echo "Playwright discovery failed or no tests matched TEST_SUITE=$TEST_SUITE."
                            exit "$DISCOVERY_STATUS"
                        fi

                        DISCOVERED_TESTS=$(printf '%s\n' "$DISCOVERY_OUTPUT" | awk '/^Total: [0-9]+ test/ { print $2 }' | tail -1)
                        if [ -z "$DISCOVERED_TESTS" ] || [ "$DISCOVERED_TESTS" -eq 0 ]; then
                            echo "No Playwright tests matched TEST_SUITE=$TEST_SUITE; failing the build instead of reporting a false success."
                            exit 1
                        fi

                        echo "Running $DISCOVERED_TESTS Playwright tests for TEST_SUITE=$TEST_SUITE with WORKERS=$WORKERS."
                        # list = readable console log, junit = Jenkins results, html = playwright-report/
                        npx playwright test "$@" --workers="$WORKERS" --reporter=list,junit,html
                    '''
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
