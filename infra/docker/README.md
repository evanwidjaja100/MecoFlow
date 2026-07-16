# Application containers

Application Dockerfiles live with each deployable. Images use Node 24, non-root runtime users, and multi-stage production outputs: API/worker images contain filtered production dependencies and compiled artifacts, while the web image uses Next.js standalone output. Build tools, source trees, tests, and unrelated workspace applications are not copied into runtime stages. Compose currently starts local dependencies; a staging-like application profile can be added after the foundation is verified.
