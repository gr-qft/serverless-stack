---
description: "Docs for the sst.AppSyncApi construct in the @serverless-stack/resources package"
---
<!--
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!                                                           !!
!!  This file has been automatically generated, do not edit  !!
!!                                                           !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-->
The `AppSyncApi` construct is a higher level CDK construct that makes it easy to create an AppSync GraphQL API. It provides a simple way to define the data sources and the resolvers in your API. And allows you to configure the specific Lambda functions if necessary. See the [examples](#examples) for more details.

## Constructor
```ts
new AppSyncApi(scope, id, props)
```
_Parameters_
- __scope__ <span class="mono">[Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Construct.html)</span>
- __id__ <span class="mono">string</span>
- __props__ <span class="mono">[AppSyncApiProps](#appsyncapiprops)</span>

## Examples

### Using the minimal config

```js
import { AppSyncApi } from "@serverless-stack/resources";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Query    getNoteById": "notesDS",
    "Mutation createNote": "notesDS",
    "Mutation updateNote": "notesDS",
    "Mutation deleteNote": "notesDS",
  },
});
```

Note that, the resolver key can have extra spaces in between, they are just ignored.


### Data source: Function

#### Auto-creating Lambda data sources

If the data sources are not configured, a Lambda data source is automatically created for each resolver.

```js
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Query    getNoteById": "src/get.main",
    "Mutation createNote": "src/create.main",
    "Mutation updateNote": "src/update.main",
    "Mutation deleteNote": "src/delete.main",
  },
});
```

#### Specifying function props for all the data sources

You can set some function props and have them apply to all the Lambda data sources.

```js {4-7}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  defaults: {
    function: {
      timeout: 20,
      environment: { tableName: "NOTES_TABLE" },
    },
  },
  dataSources: {
    notesDS: "src/notes.main",
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Mutation createNote": "notesDS",
  },
});
```

Note that, you can set the `defaultFunctionProps` while configuring the function per data source. The function one will just override the `defaultFunctionProps`.

```js {4-6,12}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  defaults: {
    function: {
      timeout: 20,
    },
  },
  dataSources: {
    notesDS: {
      function: {
        handler: "src/notes.main",
        timeout: 10,
      },
    },
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Mutation createNote": "notesDS",
  },
});
```

So in the above example, the `notesDS` data source doesn't use the `timeout` that is set in the `defaultFunctionProps`. It'll instead use the one that is defined in the function definition (`10 seconds`).

Similarly, the `defaultFunctionProps` also applies when the Lambda data sources are auto-created.

```js {4-6,10}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  defaults: {
    function: {
      timeout: 20,
    },
  },
  resolvers: {
    "Query listNotes": {
      function: {
        handler: "src/list.main",
        timeout: 10,
      },
    },
    "Mutation createNote": "src/create.main",
  },
});
```

#### Attaching permissions for the entire API

Allow the entire API to access S3.

```js {12}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Query    getNoteById": "src/get.main",
    "Mutation createNote": "src/create.main",
    "Mutation updateNote": "src/update.main",
    "Mutation deleteNote": "src/delete.main",
  },
});

api.attachPermissions(["s3"]);
```

#### Attaching permissions for a specific route

Allow one of the data sources to access S3.

```js {9}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
    billingDS: "src/billing.main",
  },
});

api.attachPermissionsToDataSource("billingDS", ["s3"]);
```

#### Attaching permissions for an auto-created data source

Allow one of the resolvers to access S3.

```js {9}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Mutation createNote": "src/create.main",
  },
});

api.attachPermissionsToDataSource("Query listNotes", ["s3"]);
```

#### Using multiple data sources

```js {4-5}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
    billingDS: "src/billing.main",
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Mutation createNote": "notesDS",
    "Mutation charge": "billingDS",
  },
});
```

#### Getting the function for a data source

```js {9-10}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
    billingDS: "src/billing.main",
  },
});

const listFunction = api.getFunction("notesDS");
const dataSource = api.getDataSource("notesDS");
```

#### Getting the function for a auto-created data source

```js {9-10}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Mutation createNote": "src/create.main",
  },
});

const listFunction = api.getFunction("Query listNotes");
const dataSource = api.getDataSource("Query listNotes");
```

### Data source: DynamoDB

```js {14}
import { MappingTemplate } from "@aws-cdk/aws-appsync-alpha";

const notesTable = new Table(this, "Notes", {
  fields: {
    id: "string"
  },
  primaryIndex: { partitionKey: "id" },
});

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    tableDS: {
      type: "dynamodb",
      table: notesTable
    },
  },
  resolvers: {
    "Query listNotes": {
      dataSource: "tableDS",
      cdk: {
        resolver: {
          requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
          responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
        },
      },
    },
  },
});
```

### Data source: RDS

```js {4-7}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    rdsDS: {
      type: "rds",
      rds: cluster,
    },
  },
  resolvers: {
    "Query listNotes": {
      dataSource: "rdsDS",
      requestMapping: {
        inline: `
          {
            "version": "2018-05-29",
            "statements": [
              "SELECT * FROM notes"
            ]
          }
        `,
      },
      responseMapping: {
        inline: `$util.rds.toJsonObject($ctx.result)`,
      },
    },
  },
});
```

### Data source: HTTP

Starting a Step Function execution on the Mutation `callStepFunction`.

```js {4-15}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    httpDS: {
      type: "http",
      endpoint: "https://states.amazonaws.com",
      cdk: {
        dataSource: {
          authorizationConfig: {
            signingRegion: "us-east-1",
            signingServiceName: "states",
          },
        },
      },
    },
  },
  resolvers: {
    "Mutation callStepFunction": {
      dataSource: "httpDS",
      requestMapping: { file: "request.vtl" },
      responseMapping: { file: "response.vtl" },
    },
  },
});
```

### Configuring resolvers

You can also add data sources and resolvers after the API has been created.

#### Adding data sources and resolvers

```js {12-18}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Mutation createNote": "notesDS",
  },
});

api.addDataSources(this, {
  billingDS: "src/billing.main",
});

api.addResolvers(this, {
  "Mutation charge": "billingDS",
});
```

#### Auto-creating Lambda data sources

```js {10-13}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Query    getNoteById": "src/get.main",
    "Mutation createNote": "src/create.main",
  },
});

api.addResolvers(this, {
  "Mutation updateNote": "src/update.main",
  "Mutation deleteNote": "src/delete.main",
});
```

#### Lazily adding resolvers

```js {5-8}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
});

api.addResolvers(this, {
  "Query    listNotes": "src/list.main",
  "Mutation createNote": "src/create.main",
});
```

#### Getting the function for a resolver

```js {18}
const api = new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  dataSources: {
    notesDS: "src/notes.main",
    billingDS: "src/billing.main",
  },
  resolvers: {
    "Query    listNotes": "notesDS",
    "Mutation createNote": "notesDS",
    "Mutation charge": "billingDS",
  },
});

const resolver = api.getResolver("Mutation charge");
```

### Custom domains

You can configure the API with a custom domain hosted either on [Route 53](https://aws.amazon.com/route53/) or [externally](#using-externally-hosted-domain).

#### Using the basic config

```js {3}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: "api.domain.com",
});
```

#### Using the full config

```js {3-6}
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: {
    domainName: "api.domain.com",
    hostedZone: "domain.com",
  },
});
```

#### Importing an existing certificate

```js {8}
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: {
    domainName: "api.domain.com",
    cdk: {
      certificate: Certificate.fromCertificateArn(this, "MyCert", certArn),
    },
  },
});
```

#### Specifying a hosted zone

If you have multiple hosted zones for a given domain, you can choose the one you want to use to configure the domain.

```js {8-11}
import { HostedZone } from "aws-cdk-lib/aws-route53";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: {
    domainName: "api.domain.com",
    cdk: {
      hostedZone: HostedZone.fromHostedZoneAttributes(this, "MyZone", {
        hostedZoneId,
        zoneName,
      }),
    },
  },
});
```

#### Loading domain name from SSM parameter

If you have the domain name stored in AWS SSM Parameter Store, you can reference the value as the domain name:

```js {3,8-9}
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const rootDomain = StringParameter.valueForStringParameter(this, `/myApp/domain`);

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: {
    domainName: `api.${rootDomain}`,
    hostedZone: rootDomain,
  },
});
```

Note that, normally SST will look for a hosted zone by stripping out the first part of the `domainName`. But this is not possible when the `domainName` is a reference. Since its value will be resolved at deploy time. So you'll need to specify the `hostedZone` explicitly.

#### Using externally hosted domain

```js {6-10}
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  customDomain: {
    isExternalDomain: true,
    domainName: "api.domain.com",
    cdk: {
      certificate: Certificate.fromCertificateArn(this, "MyCert", certArn),
    },
  },
});
```

Note that you can also migrate externally hosted domains to Route 53 by [following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).

### Authorization

#### Using API Key

```js {8-15}
import * as cdk from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  cdk: {
    graphqlApi: {
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
    },
  },
});
```

#### Using Cognito User Pool

```js {7-14}
import * as appsync from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  cdk: {
    graphqlApi: {
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
          },
        },
      },
    },
  },
});
```

#### Using AWS IAM

```js {7-11}
import * as appsync from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  cdk: {
    graphqlApi: {
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
    },
  },
});
```

#### Using OpenID Connect

```js {7-14}
import * as appsync from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  cdk: {
    graphqlApi: {
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.OIDC,
          openIdConnectConfig: {
            oidcProvider: "https://myorg.us.auth0.com",
          },
        },
      },
    },
  },
});
```

### Advanced examples

#### Configuring the GraphQL Api

Configure the internally created CDK `GraphqlApi` instance.

```js {6-11}
import * as appsync from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
  cdk: {
    graphqlApi: {
      name: "My GraphQL API",
      logConfig: {
        excludeVerboseContent: false,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      xrayEnabled: false,
    },
  },
});
```

#### Importing an existing GraphQL Api

Override the internally created CDK `GraphqlApi` instance.

```js {7-10}
import { GraphqlApi } from "@aws-cdk/aws-appsync-alpha";

new AppSyncApi(stack, "GraphqlApi", {
  cdk: {
    graphqlApi: GraphqlApi.fromGraphqlApiAttributes(this, "IGraphqlApi", {
      graphqlApiId,
    }),
  },
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Mutation createNote": "src/create.main",
  },
});
```

## AppSyncApiProps


### customDomain?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[AppSyncApiDomainProps](#appsyncapidomainprops)</span></span>

Specify a custom domain to use in addition to the automatically generated one. SST currently supports domains that are configured using [Route 53](https://aws.amazon.com/route53/)


```js
new AppSyncApi(stack, "GraphqlApi", {
  customDomain: "api.example.com"
})
```


```js
new AppSyncApi(stack, "GraphqlApi", {
  customDomain: {
    domainName: "api.example.com",
    hostedZone: "domain.com",
  }
})
```

### dataSources?

_Type_ : <span class="mono">Record&lt;<span class="mono">string</span>, <span class='mono'><span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span></span> | <span class="mono">[AppSyncApiLambdaDataSourceProps](#appsyncapilambdadatasourceprops)</span> | <span class="mono">[AppSyncApiDynamoDbDataSourceProps](#appsyncapidynamodbdatasourceprops)</span> | <span class="mono">[AppSyncApiRdsDataSourceProps](#appsyncapirdsdatasourceprops)</span> | <span class="mono">[AppSyncApiHttpDataSourceProps](#appsyncapihttpdatasourceprops)</span> | <span class="mono">[AppSyncApiNoneDataSourceProps](#appsyncapinonedatasourceprops)</span></span>&gt;</span>

Define datasources. Can be a function, dynamodb table, rds cluster or http endpoint


```js
new AppSyncApi(stack, "GraphqlApi", {
  dataSources: {
    notes: "src/notes.main",
  },
  resolvers: {
    "Query    listNotes": "notes",
  },
});
```


### defaults.function?

_Type_ : <span class="mono">[FunctionProps](Function#functionprops)</span>

The default function props to be applied to all the Lambda functions in the AppSyncApi. The `environment`, `permissions` and `layers` properties will be merged with per route definitions if they are defined.


```js
new AppSyncApi(stack, "AppSync", {
  defaults: {
    function: {
      timeout: 20,
      environment: { tableName: table.tableName },
      permissions: [table],
    }
  },
});
```


### resolvers?

_Type_ : <span class="mono">Record&lt;<span class="mono">string</span>, <span class='mono'><span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span></span> | <span class="mono">[AppSyncApiResolverProps](#appsyncapiresolverprops)</span></span>&gt;</span>

The resolvers for this API. Takes an object, with the key being the type name and field name as a string and the value is either a string with the name of existing data source.


```js
new AppSyncApi(stack, "GraphqlApi", {
  resolvers: {
    "Query    listNotes": "src/list.main",
    "Query    getNoteById": "src/get.main",
    "Mutation createNote": "src/create.main",
    "Mutation updateNote": "src/update.main",
    "Mutation deleteNote": "src/delete.main",
  },
});
```

### schema?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class='mono'>Array&lt;<span class="mono">string</span>&gt;</span></span>

The GraphQL schema definition.



```js
new AppSyncApi(stack, "GraphqlApi", {
  schema: "graphql/schema.graphql",
});
```


### cdk.graphqlApi?

_Type_ : <span class='mono'><span class="mono">[IGraphqlApi](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-appsync-alpha.IGraphqlApi.html)</span> | <span class="mono">[AppSyncApiCdkGraphqlProps](#appsyncapicdkgraphqlprops)</span></span>


## Properties
An instance of `AppSyncApi` has the following properties.
### apiArn

_Type_ : <span class="mono">string</span>

The ARN of the internally created AppSync GraphQL API.

### apiId

_Type_ : <span class="mono">string</span>

The Id of the internally created AppSync GraphQL API.

### apiName

_Type_ : <span class="mono">string</span>

The name of the internally created AppSync GraphQL API.

### customDomainUrl

_Type_ : <span class='mono'><span class="mono">undefined</span> | <span class="mono">string</span></span>

If custom domain is enabled, this is the custom domain URL of the Api.

### url

_Type_ : <span class="mono">string</span>

The AWS generated URL of the Api.


### cdk.certificate?

_Type_ : <span class="mono">[ICertificate](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager.ICertificate.html)</span>

If custom domain is enabled, this is the internally created CDK Certificate instance.

### cdk.graphqlApi

_Type_ : <span class="mono">[GraphqlApi](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-appsync-alpha.GraphqlApi.html)</span>

The internally created appsync api


## Methods
An instance of `AppSyncApi` has the following methods.
### addDataSources

```ts
addDataSources(scope, dataSources)
```
_Parameters_
- __scope__ <span class="mono">[Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Construct.html)</span>
- __dataSources__ 



Add data sources after the construct has been created


```js
api.addDataSources(stack, {
  billingDS: "src/billing.main",
});
```

### addResolvers

```ts
addResolvers(scope, resolvers)
```
_Parameters_
- __scope__ <span class="mono">[Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Construct.html)</span>
- __resolvers__ 



Add resolvers the construct has been created


```js
api.addResolvers(stack, {
  "Mutation charge": "billingDS",
});
```

### attachPermissions

```ts
attachPermissions(permissions)
```
_Parameters_
- __permissions__ <span class="mono">[Permissions](Permissions)</span>


Attaches the given list of permissions to all function datasources



```js
api.attachPermissions(["s3"]);
```

### attachPermissionsToDataSource

```ts
attachPermissionsToDataSource(key, permissions)
```
_Parameters_
- __key__ <span class="mono">string</span>
- __permissions__ <span class="mono">[Permissions](Permissions)</span>


Attaches the given list of permissions to a specific function datasource. This allows that function to access other AWS resources.


api.attachPermissionsToRoute("Mutation charge", ["s3"]);
```

### getDataSource

```ts
getDataSource(key)
```
_Parameters_
- __key__ <span class="mono">string</span>


Get a datasource by name


```js
api.getDataSource("billingDS");
```

### getFunction

```ts
getFunction(key)
```
_Parameters_
- __key__ <span class="mono">string</span>


Get the instance of the internally created Function, for a given resolver.


```js
const func = api.getFunction("Mutation charge");
```

### getResolver

```ts
getResolver(key)
```
_Parameters_
- __key__ <span class="mono">string</span>


Get a resolver


```js
api.getResolver("Mutation charge");
```

## MappingTemplateFile


### file

_Type_ : <span class="mono">string</span>

Path to the file containing the VTL mapping template

## AppSyncApiDomainProps


### domainName?

_Type_ : <span class="mono">string</span>

The domain to be assigned to the API endpoint (ie. api.domain.com)

### hostedZone?

_Type_ : <span class="mono">string</span>

The hosted zone in Route 53 that contains the domain. By default, SST will look for a hosted zone by stripping out the first part of the domainName that's passed in. So, if your domainName is api.domain.com. SST will default the hostedZone to domain.com.

### isExternalDomain?

_Type_ : <span class="mono">boolean</span>

Set this option if the domain is not hosted on Amazon Route 53.


### cdk.certificate?

_Type_ : <span class="mono">[ICertificate](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager.ICertificate.html)</span>

Override the internally created certificate

### cdk.hostedZone?

_Type_ : <span class="mono">[IHostedZone](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53.IHostedZone.html)</span>

Override the internally created hosted zone


## MappingTemplateInline


### inline

_Type_ : <span class="mono">string</span>

Inline definition of the VTL mapping template

## AppSyncApiResolverProps
Used to define full resolver config

### dataSource?

_Type_ : <span class="mono">string</span>

The data source for this resolver. The data source must be already created.

### function?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span> | <span class="mono">[FunctionProps](Function#functionprops)</span></span>

The function definition used to create the data source for this resolver.

### requestMapping?

_Type_ : <span class='mono'><span class="mono">[MappingTemplateFile](#mappingtemplatefile)</span> | <span class="mono">[MappingTemplateInline](#mappingtemplateinline)</span></span>

VTL request mapping template


```js
  requestMapping: {
    inline: '{"version" : "2017-02-28", "operation" : "Scan"}',
  },
```


```js
  requestMapping: {
    file: "path/to/template.vtl",
  },
```

### responseMapping?

_Type_ : <span class='mono'><span class="mono">[MappingTemplateFile](#mappingtemplatefile)</span> | <span class="mono">[MappingTemplateInline](#mappingtemplateinline)</span></span>

VTL response mapping template


```js
  responseMapping: {
    inline: "$util.toJson($ctx.result.items)",
  },
```


```js
  responseMapping: {
    file: "path/to/template.vtl",
  },
```


### cdk.resolver

_Type_ : <span class="mono">Omit&lt;<span class="mono">[ResolverProps](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-appsync-alpha.ResolverProps.html)</span>, <span class='mono'><span class="mono">"api"</span> | <span class="mono">"fieldName"</span> | <span class="mono">"typeName"</span> | <span class="mono">"dataSource"</span></span>&gt;</span>

This allows you to override the default settings this construct uses internally to create the resolver.


## AppSyncApiCdkGraphqlProps


### name?

_Type_ : <span class="mono">string</span>

## AppSyncApiRdsDataSourceProps
Used to define a RDS data source


```js
new AppSyncApi(stack, "AppSync", {
  dataSources: {
    rds: {
      type: "rds",
      rds: MyRDSCluster
    },
  },
});
```

### databaseName?

_Type_ : <span class="mono">string</span>

The name of the database to connect to

### description?

_Type_ : <span class="mono">string</span>

Description of the data source

### name?

_Type_ : <span class="mono">string</span>

Name of the data source

### rds?

_Type_ : <span class="mono">[RDS](RDS#rds)</span>

Target RDS construct

### type

_Type_ : <span class="mono">"rds"</span>

String literal to signify that this data source is an RDS database



### cdk.dataSource.databaseName?

_Type_ : <span class="mono">string</span>

### cdk.dataSource.secretStore

_Type_ : <span class="mono">[ISecret](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.ISecret.html)</span>

### cdk.dataSource.serverlessCluster

_Type_ : <span class="mono">[IServerlessCluster](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.IServerlessCluster.html)</span>



## AppSyncApiHttpDataSourceProps
Used to define an http data source


```js
new AppSyncApi(stack, "AppSync", {
  dataSources: {
    http: {
      type: "http",
      endpoint: "https://example.com"
    },
  },
});
```

### description?

_Type_ : <span class="mono">string</span>

Description of the data source

### endpoint

_Type_ : <span class="mono">string</span>

URL to forward requests to

### name?

_Type_ : <span class="mono">string</span>

Name of the data source

### type

_Type_ : <span class="mono">"http"</span>

String literal to signify that this data source is an HTTP endpoint



### cdk.dataSource.authorizationConfig?

_Type_ : <span class="mono">[AwsIamConfig](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-appsync-alpha.AwsIamConfig.html)</span>



## AppSyncApiNoneDataSourceProps
Used to define a none data source


```js
new AppSyncApi(stack, "AppSync", {
  dataSources: {
    http: {
      type: "http",
      endpoint: "https://example.com"
    },
  },
});
```

### description?

_Type_ : <span class="mono">string</span>

Description of the data source

### name?

_Type_ : <span class="mono">string</span>

Name of the data source

### type

_Type_ : <span class="mono">"none"</span>

String literal to signify that this data source is an HTTP endpoint

## AppSyncApiLambdaDataSourceProps
Used to define a lambda data source


```js
new AppSyncApi(stack, "AppSync", {
  dataSources: {
    lambda: {
      type: "function",
      function: "src/function.handler"
    },
  },
});
```


### description?

_Type_ : <span class="mono">string</span>

Description of the data source

### function

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span> | <span class="mono">[FunctionProps](Function#functionprops)</span></span>

Function definition

### name?

_Type_ : <span class="mono">string</span>

Name of the data source

### type?

_Type_ : <span class="mono">"function"</span>

String literal to signify that this data source is a function

## AppSyncApiDynamoDbDataSourceProps
Used to define a DynamoDB data source


```js
new AppSyncApi(stack, "AppSync", {
  dataSources: {
    table: {
      type: "table",
      table: MyTable
    },
  },
});
```

### description?

_Type_ : <span class="mono">string</span>

Description of the data source

### name?

_Type_ : <span class="mono">string</span>

Name of the data source

### table?

_Type_ : <span class="mono">[Table](Table#table)</span>

Target table

### type

_Type_ : <span class="mono">"dynamodb"</span>

String literal to signify that this data source is a dynamodb table



### cdk.dataSource.table

_Type_ : <span class="mono">[Table](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.Table.html)</span>


