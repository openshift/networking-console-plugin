# Common Jenkins Error Messages and Fixes

## Build Errors

| Error                                        | Cause                                        | Fix                                                         |
| -------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `mvn: command not found`                     | Maven not on agent PATH                      | Add tool installer or use `tools { maven 'M3' }`            |
| `JAVA_HOME is not set`                       | JDK not configured                           | Configure JDK in Global Tool Configuration                  |
| `Could not resolve dependencies`             | Artifact repo unreachable or version missing | Check Nexus/Artifactory connectivity; verify version exists |
| `GC overhead limit exceeded`                 | Not enough heap for build                    | Increase `MAVEN_OPTS=-Xmx` or agent memory                  |
| `NoSuchMethodError` / `NoClassDefFoundError` | Dependency version conflict                  | Run `mvn dependency:tree` to find conflicting versions      |

## Test Errors

| Error                                      | Cause                                | Fix                                                            |
| ------------------------------------------ | ------------------------------------ | -------------------------------------------------------------- |
| `Connection refused (port 5432)`           | Test DB not running                  | Ensure DB service starts before tests (`docker-compose up -d`) |
| `SocketTimeoutException`                   | Slow network or unresponsive service | Increase timeout; check service health before tests            |
| `AssertionError: expected <X> but was <Y>` | Actual regression or stale test data | Verify test data setup; compare with passing branch            |
| `OutOfMemoryError` in test JVM             | Test heap too small or memory leak   | Increase `-Xmx` in surefire/failsafe config; check for leaks   |
| `Flaky test detected`                      | Non-deterministic test               | Add `@RepeatedTest` locally to reproduce; fix race condition   |

## Infrastructure Errors

| Error                                         | Cause                                  | Fix                                                       |
| --------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| `No space left on device`                     | Disk full on agent                     | Clean workspace; prune Docker images; add disk monitoring |
| `Cannot connect to the Docker daemon`         | Docker not running or permission issue | Start Docker; add jenkins user to `docker` group          |
| `Agent went offline during the build`         | Network blip, agent crash, or OOM kill | Check agent system logs; increase agent resources         |
| `java.io.IOException: Unexpected termination` | Agent JVM crashed                      | Check agent heap; review `hs_err_pid` files               |
| `Waiting for next available executor`         | All agents busy or label mismatch      | Scale agents; check label matches job requirements        |

## Pipeline Config Errors

| Error                                 | Cause                                       | Fix                                                                |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `expecting '}', found ''`             | Groovy syntax error in Jenkinsfile          | Lint with `http://<jenkins>/pipeline-model-converter/validate`     |
| `No such DSL method 'X'`              | Plugin not installed or wrong pipeline type | Install required plugin; check declarative vs scripted syntax      |
| `CredentialNotFoundException`         | Credential ID not found in store            | Verify ID in Jenkins > Credentials; check folder scope             |
| `WorkflowScript: N: Expected a stage` | Malformed declarative pipeline              | Ensure all steps are inside `stage > steps` blocks                 |
| `Library 'X' not found`               | Shared library not configured               | Add library in Manage Jenkins > System > Global Pipeline Libraries |

## Permission / Auth Errors

| Error                           | Cause                       | Fix                                                              |
| ------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `401 Unauthorized`              | Token expired or invalid    | Regenerate API token; update credential in Jenkins store         |
| `403 Forbidden`                 | Insufficient permissions    | Check user/service-account permissions in target system          |
| `Host key verification failed`  | SSH key not trusted         | Add host key to known_hosts on agent, or disable strict checking |
| `SSL: certificate problem`      | Self-signed or expired cert | Update cert; or set `GIT_SSL_NO_VERIFY=true` temporarily         |
| `Permission denied (publickey)` | Wrong SSH key for repo      | Verify deploy key matches; check credential binding in pipeline  |
