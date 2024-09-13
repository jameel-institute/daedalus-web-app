FROM postgres:14.12
COPY bin /daedalus-web-app-bin
ENV PATH="/daedalus-web-app-bin:$PATH"
ENV POSTGRES_DB=daedalus-web-app
ENV POSTGRES_USER=daedalus-web-app-user
ENV POSTGRES_PASSWORD=changeme
# This is needed to override the loss of data that happens if you
# don't mount a persistent volume at the mount point.
ENV PGDATA=/pgdata

COPY conf /etc/daedalus-web-app

RUN cat /etc/daedalus-web-app/postgresql.conf /etc/daedalus-web-app/postgresql.test.conf.in > \
        /etc/daedalus-web-app/postgresql.test.conf
RUN cat /etc/daedalus-web-app/postgresql.conf /etc/daedalus-web-app/postgresql.production.conf.in > \
        /etc/daedalus-web-app/postgresql.production.conf
RUN chown -R postgres:postgres /etc/daedalus-web-app

# Ensure docker-entrypoint.sh is in the PATH
ENV PATH="/usr/local/bin:$PATH"
RUN docker-entrypoint.sh --version

ENTRYPOINT ["/daedalus-web-app-bin/start-with-config.sh"]
CMD ["/etc/daedalus-web-app/postgresql.conf"]
