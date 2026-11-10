import { readFileSync } from 'node:fs';

/* Fixtures under src/test/fixtures are captured from a live cluster.
 *
 * Provenance: scripts/seed-integration-fixtures.sh creates the objects the
 * capture needs in the suite's namespace (pods, Services, EndpointSlices, NADs,
 * UDNs, a CUDN, Ingresses, Routes, NetworkPolicies and stopped VMs),
 * record-integration-fixtures.sh reads them with `oc get --raw` through
 * sanitize-fixture.js, and the seed script is then run with --cleanup. The
 * sanitizer strips server bookkeeping, node and cluster identifiers, addresses
 * and any namespace the suite does not own.
 *
 * They are read from disk rather than imported so the JSON stays outside the
 * TypeScript module graph; the cast below is the single boundary where fixture
 * data becomes a typed resource. Jest's ESM runtime sets import.meta.url to this
 * module's file:// URL, so fixtures resolve next to this source file. */
const readFixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

export const loadFixture = <T>(name: string): T => readFixture(name) as T;

export const loadListFixture = <T>(name: string): T[] => {
  const payload = readFixture(name);

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray(payload.items)
  ) {
    return payload.items;
  }

  throw new Error(`fixture ${name} is not a Kubernetes list`);
};
