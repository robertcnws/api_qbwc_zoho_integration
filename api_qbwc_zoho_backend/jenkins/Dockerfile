# Dockerfile for Jenkins
FROM jenkins/jenkins:lts

USER root

# Instala sudo
RUN apt-get update && \
    apt-get install -y sudo && \
    rm -rf /var/lib/apt/lists/*

# Agrega permisos de sudo para el usuario jenkins
RUN echo "jenkins ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Instalar Docker dentro del contenedor de Jenkins
RUN apt-get update && \
    apt-get -y install apt-transport-https \
                       ca-certificates \
                       curl \
                       gnupg2 \
                       software-properties-common && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get -y install docker-ce-cli && \
    # Install docker-compose
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# Crea el grupo 'docker' si no existe
RUN sudo groupadd -g 1001 docker

# Crear un usuario Jenkins y agregarlo al grupo Docker
RUN sudo usermod -aG docker jenkins

# RUN sudo chown root:docker /var/run/docker.sock
# RUN sudo chmod 660 /var/run/docker.sock
# RUN ls -l /var/run/docker.sock

# Cambiar al usuario jenkins
USER jenkins
