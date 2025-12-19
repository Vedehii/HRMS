pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig
  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json
  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        APP_NAME       = "hrms-frontend"
        IMAGE_TAG      = "latest"
        REGISTRY_URL   = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        REGISTRY_REPO  = "YOUR_ROLL_NUMBER" // MANDATORY: Replace with your actual roll number
        SONAR_PROJECT  = "hrms-frontend-project"
        SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                container('dind') {
                    // We point Docker to build the frontend folder specifically
                    sh 'sleep 15'
                    sh 'docker build -t $APP_NAME:$IMAGE_TAG -f frontend/Dockerfile ./frontend'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([
                        string(credentialsId: 'SONAR_TOKEN_ID', variable: 'SONAR_TOKEN')
                    ]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=$SONAR_PROJECT \
                              -Dsonar.host.url=$SONAR_HOST_URL \
                              -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Login to Docker Registry') {
            steps {
                container('dind') {
                    sh 'sleep 10'
                    sh "docker login $REGISTRY_URL -u admin -p Changeme@2025"
                }
            }
        }

        stage('Build - Tag - Push Image') {
            steps {
                container('dind') {
                    sh '''
                        docker tag $APP_NAME:$IMAGE_TAG $REGISTRY_URL/$REGISTRY_REPO/$APP_NAME:$IMAGE_TAG
                        docker push $REGISTRY_URL/$REGISTRY_REPO/$APP_NAME:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                container('kubectl') {
                    // Changed directory to 'k8s' to match mandatory structure
                    dir('k8s') {
                        sh '''
                            kubectl apply -f deployment.yaml
                            kubectl apply -f service.yaml
                            kubectl rollout status deployment/$APP_NAME -n $REGISTRY_REPO
                        '''
                    }
                }
            }
        }
    }
}
