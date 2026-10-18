// Parameterized EvalForge Playwright pipeline for a Jenkins agent with access to the test environment.
pipeline {
    agent any

    parameters {
        string(name: 'API_BASE_URL', defaultValue: 'http://localhost:3000', description: 'Reachable EvalForge Evaluation API URL')
        string(name: 'UI_BASE_URL', defaultValue: 'http://localhost:5173', description: 'Reachable EvalForge UI URL')
        choice(name: 'TEST_SUITE',
               choices: ['smoke', 'regression', 'negative', 'integration', 'all', 'legacy-pytest'],
               description: 'Tagged Playwright suite, or the preserved learning-only pytest suite')
        choice(name: 'WORKERS',
               choices: ['1', '2', '4', '6'],
               description: 'Playwright worker count; ignored by legacy-pytest')
        choice(name: 'RETRIES',
               choices: ['0', '1', '2'],
               description: 'Retries for failed Playwright tests; ignored by legacy-pytest')
    }

    environment {
        CI = 'true'

        // Webhook-created multibranch jobs can run before Jenkins materializes parameter defaults.
        TEST_SUITE = "${params.TEST_SUITE ?: 'smoke'}"
        WORKERS = "${params.WORKERS ?: '1'}"
        RETRIES = "${params.RETRIES ?: '0'}"
        EVALFORGE_BASE_URL = "${params.API_BASE_URL ?: 'http://localhost:3000'}"
        APP_URL = "${params.UI_BASE_URL ?: 'http://localhost:5173'}"

        PLAYWRIGHT_HTML_OPEN = 'never'
        PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report'
        PLAYWRIGHT_JUNIT_OUTPUT_NAME = 'reports/playwright-results.xml'
    }

    options {
        skipDefaultCheckout(true)
        timeout(time: 25, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Parameters') {
            steps {
                // Keep command construction limited to values defined by explicit allowlists.
                sh '''
                    case "$TEST_SUITE" in
                        smoke|regression|negative|integration|all|legacy-pytest) ;;
                        *) echo "Unsupported TEST_SUITE: $TEST_SUITE"; exit 2 ;;
                    esac
                    case "$WORKERS" in 1|2|4|6) ;; *) echo "Unsupported WORKERS: $WORKERS"; exit 2 ;; esac
                    case "$RETRIES" in 0|1|2) ;; *) echo "Unsupported RETRIES: $RETRIES"; exit 2 ;; esac
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    if [ "$TEST_SUITE" = 'legacy-pytest' ]; then
                        python3 -m venv .venv
                        .venv/bin/pip install --quiet -r requirements.txt
                    else
                        npm ci

                        # Only suites containing browser tests need the Chromium binary.
                        if [ "$TEST_SUITE" = 'smoke' ] || [ "$TEST_SUITE" = 'regression' ] || [ "$TEST_SUITE" = 'all' ]; then
                            npx playwright install chromium
                        fi
                    fi
                '''
            }
        }

        stage('Verify Test Environment') {
            steps {
                // Services are externally managed; verify reachability instead of starting unknown processes.
                sh '''
                    curl -fsS -o /dev/null "$EVALFORGE_BASE_URL/health" \
                        || { echo "EvalForge API is not reachable at $EVALFORGE_BASE_URL."; exit 1; }

                    if [ "$TEST_SUITE" = 'smoke' ] || [ "$TEST_SUITE" = 'regression' ] || [ "$TEST_SUITE" = 'all' ]; then
                        curl -fsS -o /dev/null "$APP_URL" \
                            || { echo "EvalForge UI is not reachable at $APP_URL."; exit 1; }
                    fi
                '''
            }
        }

        stage('Run Tests') {
            steps {
                // Mark failures while still allowing the post block to publish diagnostic evidence.
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        if [ "$TEST_SUITE" = 'legacy-pytest' ]; then
                            set +e
                            COLLECTION_OUTPUT=$(.venv/bin/pytest --collect-only -q api_tests 2>&1)
                            COLLECTION_STATUS=$?
                            set -e
                            printf '%s\n' "$COLLECTION_OUTPUT"
                            if [ "$COLLECTION_STATUS" -eq 5 ]; then
                                echo 'No legacy pytest tests were collected.'
                                exit 1
                            fi
                            if [ "$COLLECTION_STATUS" -ne 0 ]; then
                                exit "$COLLECTION_STATUS"
                            fi
                            .venv/bin/pytest api_tests
                            exit $?
                        fi

                        case "$TEST_SUITE" in
                            smoke)       set -- --grep '@smoke' ;;
                            regression)  set -- --grep '@regression' ;;
                            negative)    set -- --grep '@negative' ;;
                            integration) set -- --grep '@integration' ;;
                            all)         set -- --grep '@(smoke|regression|negative|integration)' ;;
                        esac

                        # Discovery prevents an empty selection from producing a misleading green build.
                        set +e
                        DISCOVERY_OUTPUT=$(npx playwright test "$@" --list 2>&1)
                        DISCOVERY_STATUS=$?
                        set -e
                        printf '%s\n' "$DISCOVERY_OUTPUT"
                        if [ "$DISCOVERY_STATUS" -ne 0 ]; then
                            echo "Playwright discovery failed for TEST_SUITE=$TEST_SUITE."
                            exit "$DISCOVERY_STATUS"
                        fi

                        DISCOVERED_TESTS=$(printf '%s\n' "$DISCOVERY_OUTPUT" | awk '/^Total: [0-9]+ test/ { print $2 }' | tail -1)
                        if [ -z "$DISCOVERED_TESTS" ] || [ "$DISCOVERED_TESTS" -eq 0 ]; then
                            echo "No Playwright tests matched TEST_SUITE=$TEST_SUITE."
                            exit 1
                        fi

                        echo "Running $DISCOVERED_TESTS tests: suite=$TEST_SUITE workers=$WORKERS retries=$RETRIES"
                        npx playwright test "$@" --workers="$WORKERS" --retries="$RETRIES"
                    '''
                }
            }
        }
    }

    post {
        always {
            // JUnit powers Jenkins test history; HTML, screenshots, and traces remain downloadable artifacts.
            junit testResults: 'reports/*.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'reports/**, playwright-report/**, test-results/**',
                             allowEmptyArchive: true
        }
    }
}
