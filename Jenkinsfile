pipeline {
    agent any

    environment {
        DEPLOY_PATH = '/home/ubuntu/TRAINING-PORTAL'
    }

    stages {
        stage('Checkout & Environment Check') {
            steps {
                echo '=== Checking Node & npm Environment ==='
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Execute Production Deployment') {
            steps {
                echo '=== Running Production Deployment Script ==='
                sh '''
                    chmod +x ./scripts/deploy_production.sh
                    ./scripts/deploy_production.sh
                '''
            }
        }
    }

    post {
        success {
            echo '========================================================'
            echo ' TrainingPortal deployment completed successfully!'
            echo '========================================================'
        }
        failure {
            echo '========================================================'
            echo ' [ERROR] Deployment failed! Inspect logs for details.'
            echo '========================================================'
        }
    }
}

