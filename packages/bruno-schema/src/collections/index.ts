import * as yup from 'yup';
import { uidSchema } from '../common';

const environmentVariablesSchema = yup.object({
  uid: uidSchema,
  name: yup.string().nullable(),
  value: yup.mixed().nullable(),
  type: yup.string().oneOf(['text']).required('type is required'),
  enabled: yup.boolean().defined(),
  secret: yup.boolean()
})
  .noUnknown(true)
  .strict();

export const environmentSchema = yup.object({
  uid: uidSchema,
  name: yup.string().min(1).required('name is required'),
  variables: yup.array().of(environmentVariablesSchema).required('variables are required')
})
  .noUnknown(true)
  .strict();

export const environmentsSchema = yup.array().of(environmentSchema);

const keyValueSchema = yup.object({
  uid: uidSchema,
  name: yup.string().nullable(),
  value: yup.string().nullable(),
  description: yup.string().nullable(),
  enabled: yup.boolean()
})
  .noUnknown(true)
  .strict();

const assertionOperators: string[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'notIn',
  'contains',
  'notContains',
  'length',
  'matches',
  'notMatches',
  'startsWith',
  'endsWith',
  'between',
  'isEmpty',
  'isNotEmpty',
  'isNull',
  'isUndefined',
  'isDefined',
  'isTruthy',
  'isFalsy',
  'isJson',
  'isNumber',
  'isString',
  'isBoolean',
  'isArray'
];

const assertionSchema = keyValueSchema.shape({
  operator: yup
    .string()
    .oneOf(assertionOperators)
    .nullable()
    .optional()
})
  .noUnknown(true)
  .strict();

const varsSchema = yup.object({
  uid: uidSchema,
  name: yup.string().nullable(),
  value: yup.string().nullable(),
  description: yup.string().nullable(),
  enabled: yup.boolean(),
  local: yup.boolean()
})
  .noUnknown(true)
  .strict();

const requestUrlSchema = yup.string().min(0).defined();
const requestMethodSchema = yup
  .string()
  .min(1, 'method is required')
  .required('method is required');

const graphqlBodySchema = yup.object({
  query: yup.string().nullable(),
  variables: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const multipartFormSchema = yup.object({
  uid: uidSchema,
  type: yup.string().oneOf(['file', 'text']).required('type is required'),
  name: yup.string().nullable(),
  value: yup.mixed().when('type', {
    is: 'file',
    then: yup.array().of(yup.string().nullable()).nullable(),
    otherwise: yup.string().nullable()
  }),
  description: yup.string().nullable(),
  contentType: yup.string().nullable(),
  enabled: yup.boolean()
})
  .noUnknown(true)
  .strict();

const fileSchema = yup.object({
  uid: uidSchema,
  filePath: yup.string().nullable(),
  contentType: yup.string().nullable(),
  selected: yup.boolean()
})
  .noUnknown(true)
  .strict();

const requestBodySchema = yup.object({
  mode: yup
    .string()
    .oneOf(['none', 'json', 'text', 'xml', 'formUrlEncoded', 'multipartForm', 'graphql', 'sparql', 'file'])
    .required('mode is required'),
  json: yup.string().nullable(),
  text: yup.string().nullable(),
  xml: yup.string().nullable(),
  sparql: yup.string().nullable(),
  formUrlEncoded: yup.array().of(keyValueSchema).nullable(),
  multipartForm: yup.array().of(multipartFormSchema).nullable(),
  graphql: graphqlBodySchema.nullable(),
  file: yup.array().of(fileSchema).nullable()
})
  .noUnknown(true)
  .strict();

const authAwsV4Schema = yup.object({
  accessKeyId: yup.string().nullable(),
  secretAccessKey: yup.string().nullable(),
  sessionToken: yup.string().nullable(),
  service: yup.string().nullable(),
  region: yup.string().nullable(),
  profileName: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authBasicSchema = yup.object({
  username: yup.string().nullable(),
  password: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authWsseSchema = yup.object({
  username: yup.string().nullable(),
  password: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authBearerSchema = yup.object({
  token: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authDigestSchema = yup.object({
  username: yup.string().nullable(),
  password: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authNTLMSchema = yup.object({
  username: yup.string().nullable(),
  password: yup.string().nullable(),
  domain: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authApiKeySchema = yup.object({
  key: yup.string().nullable(),
  value: yup.string().nullable(),
  placement: yup.string().oneOf(['header', 'queryparams']).nullable()
})
  .noUnknown(true)
  .strict();

const oauth2AuthorizationAdditionalParametersSchema = yup.object({
  name: yup.string().nullable(),
  value: yup.string().nullable(),
  sendIn: yup
    .string()
    .oneOf(['headers', 'queryparams'])
    .required('send in property is required'),
  enabled: yup.boolean()
})
  .noUnknown(true)
  .strict();

const oauth2AdditionalParametersSchema = yup.object({
  name: yup.string().nullable(),
  value: yup.string().nullable(),
  sendIn: yup
    .string()
    .oneOf(['headers', 'queryparams', 'body'])
    .required('send in property is required'),
  enabled: yup.boolean()
})
  .noUnknown(true)
  .strict();

const oauth2Schema = yup.object({
  grantType: yup
    .string()
    .oneOf(['client_credentials', 'password', 'authorization_code', 'implicit'])
    .required('grantType is required'),
  username: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  password: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  callbackUrl: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  authorizationUrl: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  accessTokenUrl: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  clientId: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  clientSecret: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  scope: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  state: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  pkce: yup.boolean().when('grantType', {
    is: (val: unknown): val is string => ['authorization_code'].includes(val as string),
    then: yup.boolean().default(false),
    otherwise: yup.boolean()
  }),
  credentialsPlacement: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  credentialsId: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  tokenPlacement: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  tokenHeaderPrefix: yup.string().when(['grantType', 'tokenPlacement'], {
    is: (grantType: unknown, tokenPlacement: unknown): boolean =>
      ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(grantType as string) &&
      tokenPlacement === 'header',
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  tokenQueryKey: yup.string().when(['grantType', 'tokenPlacement'], {
    is: (grantType: unknown, tokenPlacement: unknown): boolean =>
      ['client_credentials', 'password', 'authorization_code', 'implicit'].includes(grantType as string) &&
      tokenPlacement === 'url',
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  refreshTokenUrl: yup.string().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code'].includes(val as string),
    then: yup.string().nullable(),
    otherwise: yup.string().nullable().strip()
  }),
  autoRefreshToken: yup.boolean().when('grantType', {
    is: (val: unknown): val is string => ['client_credentials', 'password', 'authorization_code'].includes(val as string),
    then: yup.boolean().default(false),
    otherwise: yup.boolean()
  }),
  autoFetchToken: yup.boolean().when('grantType', {
    is: (val: unknown): val is string => ['authorization_code', 'implicit'].includes(val as string),
    then: yup.boolean().default(true),
    otherwise: yup.boolean()
  }),
  additionalParameters: yup.object({
    authorization: yup.mixed().when('grantType', {
      is: 'authorization_code',
      then: yup.array().of(oauth2AuthorizationAdditionalParametersSchema).required(),
      otherwise: yup.mixed().nullable().optional()
    }),
    token: yup.array().of(oauth2AdditionalParametersSchema).optional(),
    refresh: yup.array().of(oauth2AdditionalParametersSchema).optional()
  })
})
  .noUnknown(true)
  .strict();

const authSchema = yup.object({
  mode: yup
    .string()
    .oneOf(['inherit', 'none', 'awsv4', 'basic', 'bearer', 'digest', 'ntlm', 'oauth2', 'wsse', 'apikey'])
    .required('mode is required'),
  awsv4: authAwsV4Schema.nullable(),
  basic: authBasicSchema.nullable(),
  bearer: authBearerSchema.nullable(),
  ntlm: authNTLMSchema.nullable(),
  digest: authDigestSchema.nullable(),
  oauth2: oauth2Schema.nullable(),
  wsse: authWsseSchema.nullable(),
  apikey: authApiKeySchema.nullable()
})
  .noUnknown(true)
  .strict()
  .nullable();

const requestParamsSchema = yup.object({
  uid: uidSchema,
  name: yup.string().nullable(),
  value: yup.string().nullable(),
  description: yup.string().nullable(),
  type: yup.string().oneOf(['query', 'path']).required('type is required'),
  enabled: yup.boolean()
})
  .noUnknown(true)
  .strict();

const exampleSchema = yup.object({
  uid: uidSchema,
  itemUid: uidSchema,
  name: yup.string().min(1, 'name must be at least 1 character').required('name is required'),
  description: yup.string().nullable(),
  type: yup
    .string()
    .oneOf(['http-request', 'graphql-request', 'grpc-request'])
    .required('type is required'),
  request: yup
    .object({
      url: requestUrlSchema,
      method: requestMethodSchema,
      headers: yup.array().of(keyValueSchema).required('headers are required'),
      params: yup.array().of(requestParamsSchema).required('params are required'),
      body: requestBodySchema
    })
    .noUnknown(true)
    .strict()
    .nullable(),
  response: yup
    .object({
      status: yup.string().nullable(),
      statusText: yup.string().nullable(),
      headers: yup.array().of(keyValueSchema).nullable(),
      body: yup
        .object({
          type: yup.string().oneOf(['json', 'text', 'xml', 'html', 'binary']).nullable(),
          content: yup.mixed().nullable()
        })
        .nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable()
})
  .noUnknown(true)
  .strict();

export const requestSchema = yup.object({
  url: requestUrlSchema,
  method: requestMethodSchema,
  headers: yup.array().of(keyValueSchema).required('headers are required'),
  params: yup.array().of(requestParamsSchema).required('params are required'),
  auth: authSchema,
  body: requestBodySchema,
  script: yup
    .object({
      req: yup.string().nullable(),
      res: yup.string().nullable()
    })
    .noUnknown(true)
    .strict(),
  vars: yup
    .object({
      req: yup.array().of(varsSchema).nullable(),
      res: yup.array().of(varsSchema).nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable(),
  assertions: yup.array().of(assertionSchema).nullable(),
  tests: yup.string().nullable(),
  docs: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const grpcRequestSchema = yup.object({
  url: requestUrlSchema,
  method: yup.string().optional(),
  methodType: yup
    .string()
    .oneOf(['unary', 'client-streaming', 'server-streaming', 'bidi-streaming', ''])
    .nullable(),
  protoPath: yup.string().nullable(),
  headers: yup.array().of(keyValueSchema).required('headers are required'),
  auth: authSchema,
  body: yup
    .object({
      mode: yup.string().oneOf(['grpc']).required('mode is required'),
      grpc: yup
        .array()
        .of(
          yup.object({
            name: yup.string().nullable(),
            content: yup.string().nullable()
          })
        )
        .nullable()
    })
    .strict()
    .required('body is required'),
  script: yup
    .object({
      req: yup.string().nullable(),
      res: yup.string().nullable()
    })
    .noUnknown(true)
    .strict(),
  vars: yup
    .object({
      req: yup.array().of(varsSchema).nullable(),
      res: yup.array().of(varsSchema).nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable(),
  assertions: yup.array().of(assertionSchema).nullable(),
  tests: yup.string().nullable(),
  docs: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const wsRequestSchema = yup.object({
  url: requestUrlSchema,
  headers: yup.array().of(keyValueSchema).required('headers are required'),
  auth: authSchema,
  body: yup
    .object({
      mode: yup.string().oneOf(['ws']).required('mode is required'),
      ws: yup
        .array()
        .of(
          yup.object({
            name: yup.string().nullable(),
            type: yup.string().nullable(),
            content: yup.string().nullable()
          })
        )
        .nullable()
    })
    .strict()
    .required('body is required'),
  script: yup
    .object({
      req: yup.string().nullable(),
      res: yup.string().nullable()
    })
    .noUnknown(true)
    .strict(),
  vars: yup
    .object({
      req: yup.array().of(varsSchema).nullable(),
      res: yup.array().of(varsSchema).nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable(),
  assertions: yup.array().of(assertionSchema).nullable(),
  tests: yup.string().nullable(),
  docs: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const wsSettingsSchema = yup.object({
  settings: yup
    .object({
      timeout: yup.number().default(500),
      keepAliveInterval: yup.number().default(0)
    })
    .noUnknown(true)
    .strict()
    .nullable()
});

const folderRootSchema = yup.object({
  request: yup
    .object({
      headers: yup.array().of(keyValueSchema).nullable(),
      auth: authSchema,
      script: yup
        .object({
          req: yup.string().nullable(),
          res: yup.string().nullable()
        })
        .noUnknown(true)
        .strict()
        .nullable(),
      vars: yup
        .object({
          req: yup.array().of(varsSchema).nullable(),
          res: yup.array().of(varsSchema).nullable()
        })
        .noUnknown(true)
        .strict()
        .nullable(),
      tests: yup.string().nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable(),
  docs: yup.string().nullable(),
  meta: yup
    .object({
      name: yup.string().nullable(),
      seq: yup.number().min(1).nullable()
    })
    .noUnknown(true)
    .strict()
    .nullable()
})
  .noUnknown(true)
  .nullable();

export const itemSchema: yup.AnyObjectSchema = yup.object({
  uid: uidSchema,
  type: yup
    .string()
    .oneOf(['http-request', 'graphql-request', 'folder', 'js', 'grpc-request', 'ws-request'])
    .required('type is required'),
  seq: yup.number().min(1),
  name: yup.string().min(1, 'name must be at least 1 character').required('name is required'),
  tags: yup.array().of(yup.string().matches(/^[\w-]+$/, 'tag must be alphanumeric')),
  request: yup
    .mixed()
    .when('type', {
      is: (type: unknown): type is string => type === 'grpc-request',
      then: grpcRequestSchema.required('request is required when item-type is grpc-request'),
      otherwise: yup
        .mixed()
        .when('type', {
          is: (type: unknown): type is string => type === 'ws-request',
          then: wsRequestSchema.required('request is required when item-type is ws-request'),
          otherwise: requestSchema.when('type', {
            is: (type: unknown): type is string =>
              ['http-request', 'graphql-request'].includes(type as string),
            then: (schema) => schema.required('request is required when item-type is request')
          })
        })
    }),
  settings: yup
    .mixed()
    .when('type', {
      is: (type: unknown): type is string => type === 'ws-request',
      then: wsSettingsSchema,
      otherwise: yup
        .object({
          encodeUrl: yup.boolean().nullable(),
          followRedirects: yup.boolean().nullable(),
          maxRedirects: yup.number().min(0).max(50).nullable(),
          timeout: yup.mixed().nullable()
        })
        .noUnknown(true)
        .strict()
        .nullable()
    }),
  fileContent: yup.string().when('type', {
    is: 'js',
    then: yup.string(),
    otherwise: yup.string().nullable()
  }),
  root: yup.mixed().when('type', {
    is: 'folder',
    then: folderRootSchema,
    otherwise: yup.mixed().nullable().notRequired()
  }),
  items: yup.array().of(
    yup.lazy(() => {
      return itemSchema;
    }) as unknown as yup.AnySchema
  ),
  examples: yup.array().of(exampleSchema).when('type', {
    is: (type: unknown): type is string =>
      ['http-request', 'graphql-request', 'grpc-request'].includes(type as string),
    then: (schema) => schema.nullable(),
    otherwise: yup.array().strip()
  }),
  filename: yup.string().nullable(),
  pathname: yup.string().nullable()
})
  .noUnknown(true)
  .strict();

export const collectionSchema = yup.object({
  version: yup.string().oneOf(['1']).required('version is required'),
  uid: uidSchema,
  name: yup.string().min(1, 'name must be at least 1 character').required('name is required'),
  items: yup.array().of(itemSchema),
  activeEnvironmentUid: yup
    .string()
    .length(21, 'activeEnvironmentUid must be 21 characters in length')
    .matches(/^[a-zA-Z0-9]*$/, 'uid must be alphanumeric')
    .nullable(),
  environments: environmentsSchema,
  pathname: yup.string().nullable(),
  runnerResult: yup.object({
    items: yup.array()
  }),
  runtimeVariables: yup.object(),
  brunoConfig: yup.object(),
  root: folderRootSchema
})
  .noUnknown(true)
  .strict();
