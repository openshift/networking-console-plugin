import * as _ from 'lodash';

import {
  consoleFetchJSON,
  getGroupVersionKindForModel,
  K8sModel,
} from '@openshift-console/dynamic-plugin-sdk';

export const getDefinitionKey = _.memoize(
  (model: K8sModel, definitions: SwaggerDefinitions): string => {
    return _.findKey(definitions, (def: SwaggerDefinition) => {
      return _.some(def['x-kubernetes-group-version-kind'], ({ group, kind, version }) => {
        return (
          (model?.apiGroup ?? '') === (group || '') &&
          model?.apiVersion === version &&
          model?.kind === kind
        );
      });
    });
  },
  getGroupVersionKindForModel,
);

let swaggerDefinitions: SwaggerDefinitions;
export const getSwaggerDefinitions = (): SwaggerDefinitions => swaggerDefinitions;

export const fetchSwagger = async (): Promise<SwaggerDefinitions> => {
  try {
    const response: SwaggerAPISpec = await consoleFetchJSON('api/kubernetes/openapi/v2');
    if (!response.definitions) {
      // eslint-disable-next-line no-console
      console.error('Definitions missing in OpenAPI response.');
      return null;
    }
    swaggerDefinitions = response.definitions;
    return swaggerDefinitions;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not get OpenAPI definitions', e);
    return null;
  }
};

const getRef = (definition: SwaggerDefinition): string => {
  const ref = definition.$ref || _.get(definition, 'items.$ref');
  const re = /^#\/definitions\//;
  // Only follow JSON pointers, not external URI references.
  return ref && re.test(ref) ? ref.replace(re, '') : null;
};

// Get the path in the swagger document to additional property details.
// This can be
// - A reference to another top-level definition
// - Inline property declartions
// - Inline property declartions for array items
export const getSwaggerPath = (
  allProperties: SwaggerDefinitions,
  currentPath: string[],
  name: string,
  followRef: boolean,
): string[] => {
  const nextPath = [...currentPath, 'properties', name];
  const definition = _.get(allProperties, nextPath) as SwaggerDefinition;
  if (!definition) {
    return null;
  }
  const ref = getRef(definition);
  return followRef && ref ? [ref] : nextPath;
};

export const findDefinition = (kindObj: K8sModel, propertyPath: string[]): SwaggerDefinition => {
  if (!swaggerDefinitions) {
    return null;
  }

  const rootPath = getDefinitionKey(kindObj, swaggerDefinitions);
  const path = propertyPath.reduce(
    (currentPath: string[], nextProperty: string, i: number): string[] => {
      if (!currentPath) {
        return null;
      }
      // Don't follow the last reference since the description is not as good.
      const followRef = i !== propertyPath.length - 1;
      return getSwaggerPath(swaggerDefinitions, currentPath, nextProperty, followRef);
    },
    [rootPath],
  );

  return path ? (_.get(swaggerDefinitions, path) as SwaggerDefinition) : null;
};

export const getPropertyDescription = (
  kindObj: K8sModel,
  propertyPath: string | string[],
): string => {
  const path: string[] = _.toPath(propertyPath);
  const definition = findDefinition(kindObj, path);
  return definition ? definition.description : null;
};

export const getResourceDescription = _.memoize((kindObj: K8sModel): string => {
  if (!swaggerDefinitions) {
    return null;
  }
  const key = getDefinitionKey(kindObj, swaggerDefinitions);
  return _.get(swaggerDefinitions, [key, 'description']);
}, getGroupVersionKindForModel);

export type SwaggerDefinition = {
  $ref?: string;
  definitions?: SwaggerDefinitions;
  description?: string;
  enum?: string[];
  items?: SwaggerDefinition;
  properties?: {
    [prop: string]: SwaggerDefinition;
  };
  required?: string[];
  type?: string | string[];
};

export type SwaggerDefinitions = {
  [name: string]: SwaggerDefinition;
};

export type SwaggerAPISpec = {
  definitions: SwaggerDefinitions;
  info: { title: string; version: string };
  paths: { [path: string]: any };
  swagger: string;
};

fetchSwagger();
