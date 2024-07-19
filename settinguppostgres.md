1. Install package
2. Log in as 'postgres' user
```
sudo -u postgres psql
```
3. Create another superuser
```
CREATE USER dmears SUPERUSER;
```
Now you can run commands like 'createdb' from the command line.
4. Create a db to test you can
```bash
# command line
createdb
```
Should create a db called 'dmears'
```bash
createdb daedalus-app-dev
```
5. You can now open up the database daedalus-app-dev as dmears
```bash
psql daedalus-app-dev
```
or as postgres
```bash
sudo -u postgres psql daedalus-app-dev
```

6. Set the password for dmears
```bash
ALTER USER dmears WITH PASSWORD 'pAsSwOrD';
```

7. Set the DATABASE_URL env var in .env
https://www.prisma.io/dataguide/postgresql/short-guides/connection-uris#a-quick-overview
