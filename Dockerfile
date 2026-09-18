# Builder container
FROM registry.ci.openshift.org/ocp/builder:rhel-9-base-nodejs-openshift-5.0 AS build

# Copy app source
COPY . /opt/app-root/src/app
WORKDIR /opt/app-root/src/app

USER 0

# prevent npm registry timeouts when building OKD images
# use 10min fetch timeout and up to 1min between retries
# retry config details: https://www.npmjs.com/package/retry
RUN npm config set loglevel http 
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retries 9
RUN npm config set fetch-retry-factor 2

# Install dependencies and build
ENV CYPRESS_INSTALL_BINARY=0
RUN npm clean-install --ignore-scripts --no-audit && npm run build

# Web server container
FROM registry.ci.openshift.org/ocp/5.0:base-rhel9

RUN INSTALL_PKGS="nginx" && \
    dnf install -y --setopt=tsflags=nodocs $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    dnf -y clean all --enablerepo='*' && rm -rf /var/cache/dnf/* && \
    chown -R 1001:0 /var/lib/nginx /var/log/nginx /run && \
    chmod -R ug+rwX /var/lib/nginx /var/log/nginx /run

# Use non-root user
USER 1001

COPY --from=build /opt/app-root/src/app/dist /opt/app-root/src

# Run the server
CMD nginx -g "daemon off;"
