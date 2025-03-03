# Builder container
FROM registry.ci.openshift.org/ocp/builder:rhel-9-base-nodejs-openshift-4.19 AS build

# Install yarn
RUN npm install -g yarn -s &>/dev/null

# Copy app source
COPY . /opt/app-root/src/app
WORKDIR /opt/app-root/src/app

# Run install as supper tux
USER 0
RUN yarn install --frozen-lockfile --network-timeout 600000 && yarn build

# Web server container
FROM registry.ci.openshift.org/ocp/4.19:base-rhel9

RUN INSTALL_PKGS="nginx" && \
    dnf install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum -y clean all --enablerepo='*' && \
    chown -R 1001:0 /var/lib/nginx /var/log/nginx /run && \
    chmod -R ug+rwX /var/lib/nginx /var/log/nginx /run

# Use none-root user
USER 1001

# Set nginx configuration
# COPY nginx.conf /etc/nginx/nginx.conf

# When using ubi9/nginx-120 defaults:
#  listen       8080 default_server;
#  root         /opt/app-root/src;

COPY --from=build /opt/app-root/src/app/dist /opt/app-root/src

# Run the server
CMD nginx -g "daemon off;"
