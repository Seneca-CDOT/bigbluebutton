IMPORTANT: this is a work in progress!

# Purpose

The purpose of this repo is to get BigBlueButton working in a multi-container Docker configuration over a single port, then to deploy and scale it using Kubernetes

# Launching BBB via Docker

## Prerequisites

#### Ensure you have the latest version of Docker-CE by following the install steps

Automatically:
```
curl -fsSL get.docker.com -o get-docker.sh
sh get-docker.sh
```

Manually:

Ubuntu: https://docs.docker.com/install/linux/docker-ce/ubuntu/

Fedora: https://docs.docker.com/install/linux/docker-ce/fedora/

IMPORTANT: If doing a manual install, make sure to also do the post install steps:

https://docs.docker.com/install/linux/linux-postinstall/

#### Install docker-compose

Ubuntu: 
```
sudo apt-get install docker-compose
```

Fedora:
```
sudo dnf install docker-compose
```

## Build all docker images

#### Build all docker images with one command
```
cd labs/docker/
make release
```

#### Verify that you have all the necessary images
```
docker images
```

You should see:
* sbt
* bbb-common-message
* bbb-common-web
* bbb-fsesl-client
* bbb-apps-akka
* bbb-fsesl-akka
* bbb-web
* bbb-html5
* bbb-webrtc-sfu
* bbb-webhooks
* bbb-kurento
* bbb-freeswitch
* bbb-nginx
* bbb-coturn
* bbb-lti


In the event that any of the above images are missing, you'll need to build them individually

## Build images individually

sbt is needed to build the Scala components
```
cd labs/docker/sbt/
docker build -t 'sbt:0.13.8' .
```

Build libraries
```
cd bbb-common-message/
docker build -t 'bbb-common-message' --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .

cd bbb-common-web/
docker build -t 'bbb-common-web' --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .

cd bbb-fsesl-client/
docker build -t 'bbb-fsesl-client' --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .
```

Build akka components
```
cd akka-bbb-apps/
docker build -t bbb-apps-akka --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .

# Not needed since we're setting up HTML5 only
cd akka-bbb-transcode/
docker build -t bbb-transcode --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .

cd akka-bbb-fsesl/
docker build -t bbb-fsesl-akka --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .
```

Build bbb-web
```
cd bigbluebutton-web/
docker build -t bbb-web --build-arg COMMON_VERSION=0.0.1-SNAPSHOT .
```

Build bbb-html5
```
cd bigbluebutton-html5/
docker build -t bbb-html5 .
```

Build bbb-webrtc-sfu
```
cd labs/bbb-webrtc-sfu/
docker build -t bbb-webrtc-sfu .
```

Build bbb-webhooks
```
cd bbb-webhooks/
docker build -t bbb-webhooks .
```

Build Kurento Media Server
```
cd labs/docker/kurento/
docker build -t bbb-kurento .
```

Build FreeSWITCH
```
cd labs/docker/freeswitch/
docker build -t bbb-freeswitch .
```

Build nginx
```
cd labs/docker/nginx/
docker build -t bbb-nginx .
```

Build coturn
```
cd labs/docker/coturn
docker build -t bbb-coturn .
```

(Optional) Build bbb-lti
```
cd bbb-lti/
docker build -t bbb-lti .
```

## Setup

#### Export your configuration as environment variables
IMPORTANT: replace the example SERVER_DOMAIN's value with your own FQDN
```
export SERVER_DOMAIN=docker.bigbluebutton.org
export EXTERNAL_IP=$(dig +short $SERVER_DOMAIN | grep '^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*$' | head -n 1)
export SHARED_SECRET=`openssl rand -hex 16`
export COTURN_REST_SECRET=`openssl rand -hex 16`
export SECRET_KEY_BASE=`openssl rand -hex 64`
export SCREENSHARE_EXTENSION_KEY=akgoaoikmbmhcopjgakkcepdgdgkjfbc
export SCREENSHARE_EXTENSION_LINK=https://chrome.google.com/webstore/detail/bigbluebutton-screenshare/akgoaoikmbmhcopjgakkcepdgdgkjfbc
export TAG_PREFIX=
export TAG_SUFFIX=
```

#### Create a volume for the SSL certs
```
docker volume create docker_ssl-conf	
```	

#### Generate SSL certs	
```	
docker run --rm -p 80:80 -v docker_ssl-conf:/etc/letsencrypt -it certbot/certbot certonly --non-interactive --register-unsafely-without-email --agree-tos --expand --domain $SERVER_DOMAIN --standalone	

# certificate path: docker_ssl-conf/live/$SERVER_DOMAIN/fullchain.pem	
# key path: docker_ssl-conf/live/$SERVER_DOMAIN/privkey.pem	
```
IMPORTANT: If running on AWS, you won't be able to use the default Public DNS for your SERVER_DOMAIN as Let's Encrypt doesn't allow generating SSL certs from any *.amazonaws.com domain. Alternatively, you can create a PTR record that goes from a non-AWS FQDN to the AWS FQDN.

#### Create a volume for the static files (optional)
```
docker volume create docker_static
cd bigbluebutton-config/web/
docker run -d --rm --name nginx -v docker_static:/var/www/bigbluebutton-default nginx tail -f /dev/null
docker cp . nginx:/var/www/bigbluebutton-default
docker exec -it nginx chown -R www-data:www-data /var/www/bigbluebutton-default
docker stop nginx
```

#### Ensure the following ports are open
* TCP/UDP 3478
* TCP 80
* TCP 443

## Run

#### Launch everything with docker compose
```
cd labs/docker/
docker-compose up
```

#### Access your server via greenlight and create meetings

https://<your_fqdn_here>/b

#### To shut down and exit gracefully
```
CTRL+C
```


# Setting up a Kubernetes Cluster

## Prerequisites

#### Disable swap by commenting out the "swap" line in /etc/fstab, then do a reboot
```
sudo swapoff -a
sudo vi /etc/fstab
sudo systemctl reboot
```

#### Verify swap is disabled
```
sudo free -h
```

#### Install Minikube (if using VM's as nodes)

https://kubernetes.io/docs/tasks/tools/install-minikube/

#### Install VirtualBox Manager (if using VM's as nodes)

Ubuntu:
```
sudo apt-get install virtualbox
```

Fedora:
```
sudo dnf install virtualbox
```

## Setup

#### The following kernel modules are required to avoid preflight errors and warnings during cluster setup
* ip_vs
* ip_vs_rr
* ip_vs_wrr
* ip_vs_sh

#### Check if kernel modules are already loaded
```
lsmod | grep ip_vs
```

#### Add the kernel modules (if not already loaded)
```
sudo modprobe ip_vs
sudo modprobe ip_vs_rr
sudo modprobe ip_vs_wrr
sudo modprobe ip_vs_sh
```

#### Ensure required ports are open

https://kubernetes.io/docs/setup/independent/install-kubeadm/#check-required-ports

#### Install kubeadm, kubelet, and kubectl

https://kubernetes.io/docs/setup/independent/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl

#### Add kubectl autocomplete to the Bash shell (optional)
```
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

#### Create a single master cluster with kubeadm + Flannel
IMPORTANT: the `kubeadm init` command will generate a join command towards the end of the output, make note of that command as you'll need it to join nodes to your cluster later on
```
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
sudo sysctl net.bridge.bridge-nf-call-iptables=1
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

#### Deploy Kubernetes Dashboard UI
```
kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml
```

Kubeadm enforces RBAC, so ClusterRoleBinding will need access to the dashboard. Create this file in your .kube directory:
```
vi ~/.kube/kube-dashboard-access.yaml
```
```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
  labels:
    k8s-app: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kube-system
```

Apply the changes to the cluster:
```
kubectl create -f ~/.kube/kube-dashboard-access.yaml
```
Start the dashboard:
```
kubectl proxy
```
Navigate to the dashboard in your browser:

http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/

At the sign-in prompt, press 'skip'

#### Join your nodes to the cluster

Use the join command that was generated from `kubeadm init` earlier to add nodes to the cluster

## Deploy

https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/
