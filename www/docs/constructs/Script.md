---
description: "Docs for the sst.Script construct in the @serverless-stack/resources package"
---
<!--
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!                                                           !!
!!  This file has been automatically generated, do not edit  !!
!!                                                           !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-->
The `Script` construct is a higher level CDK construct that makes it easy to run a script in a Lambda function during the deployment process. It provides a simple way to build and bundle the script function; and allows you to pass parameter values based on outputs from other constructs in your SST app. So you don't have to hard code values in your script. You can configure a script to run before or after any of the stacks or resources are deployed in your app.

Since the script is running inside a Lambda function, it can interact with resources like the RDS databases, that are inside a VPC; and make AWS API calls to services that the IAM credentials in your local environment or CI might not have permissions to.

A few things to note:
- It does not run locally. It runs inside a Lambda function.
- It gets run on every deployment.
- It can run for a maximum of 15 minutes.
- [Live Lambda Dev](/live-lambda-development.md) is not enabled for these functions.


## Constructor
```ts
new Script(scope, id, props)
```
_Parameters_
- __scope__ <span class="mono">[Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Construct.html)</span>
- __id__ <span class="mono">string</span>
- __props__ <span class="mono">[ScriptProps](#scriptprops)</span>

## Examples

### Minimal config

```js
import { Script } from "@serverless-stack/resources";

new Script(stack, "Script", {
  onCreate: "src/function.create",
  onUpdate: "src/function.update",
  onDelete: "src/function.delete",
});
```



### Configuring parameters

The `params` will be passed in as the `event` object to the function.

```js {12-15}
import { Table, Script } from "@serverless-stack/resources";

const table = new Table(this, "Table", {
  fields: {
    userId: "string",
  },
  primaryIndex: { partitionKey: "userId" },
});

new Script(stack, "Script", {
  onCreate: "src/script.create",
  params: {
    hello: "world",
    tableName: table.tableName,
  },
});
```

So in the above example, the `event.params.tableName` will be available in the onCreate function in `src/script.create`.

Note that, the value for `tableName` will be resolved at deploy time. For example, in this case, the `Table` construct will get created first, and the `Script` construct will be run afterwards. And if you were to print out the value of `event.params.tableName` inside the onCreate function, you will see the name of the table.

### Configuring functions

#### Specifying function props for all the functions

You can extend the minimal config, to set some function props and have them apply to all the functions.

```js {3-7}
new Script(stack, "Script", {
  defaults: {
    function: {
      timeout: 20,
      environment: { tableName: table.tableName },
      permissions: [table],
    },
  },
  onCreate: "src/script.create",
});
```

#### Configuring an individual function

Configure each Lambda function separately.

```js
new Script(stack, "Script", {
  onCreate: {
    srcPath: "src/",
    handler: "script.create",
    environment: { tableName: table.tableName },
    permissions: [table],
  },
});
```

Note that, you can set the `defaults.function` while configuring a Lambda function. The function's props will just override the `defaults.function`. Except for the `environment`, the `layers`, and the `permissions` properties, that will be merged.

```js
new Script(stack, "Script", {
  defaults: {
    function: {
      timeout: 20,
      environment: { tableName: table.tableName },
      permissions: [table],
    },
  },
  onCreate: {
    handler: "src/script.create",
    timeout: 10,
    environment: { bucketName: bucket.bucketName },
    permissions: [bucket],
  },
  onUpdate: "src/script.update",
});
```

So in the above example, the `onCreate` function doesn't use the `timeout` that is set in the `defaults.function`. It'll instead use the one that is defined in the function definition (`10 seconds`). And the function will have both the `tableName` and the `bucketName` environment variables set; as well as permissions to both the `table` and the `bucket`.

#### Attaching permissions

You can grant additional [permissions](Permissions.md) to the script.

```js {7}
const script = new Script(stack, "Script", {
  onCreate: "src/script.create",
  onUpdate: "src/script.update",
  onDelete: "src/script.delete",
});

script.attachPermissions(["s3"]);
```

### Running before deploy

You can configure the `Script` to run at the beginning of the deployment, before any resources are deployed.

First, create a stack for the construct. Let's call it `BeforeDeployStack` and add it to your `stacks/index.js`.

```js title="stacks/index.js"
const beforeDeployStack = new BeforeDeployStack(app, "before-deploy");

const apiStack = new ApiStack(app, "api");
const dbStack = new DBStack(app, "db");

apiStack.addDependency(beforeDeployStack);
dbStack.addDependency(beforeDeployStack);
```

By making both `ApiStack` and `DBStack` depend on `BeforeDeployStack`, they will get deployed after `BeforeDeployStack` is done deploying.

Here we are making use of the idea of [Stack dependencies](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html#stack-dependencies) in CDK.

Then, let's add the script to the `BeforeDeployStack`.

```js title="stacks/BeforeDeployStack.js"
import { Stack, Script } from "@serverless-stack/resources";

export class BeforeDeployStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    new Script(stack, "BeforeDeploy", {
      onCreate: "src/script.create",
    });
  }
}
```

Now when you deploy this app, the `BeforeDeployStack` will get deployed first, which runs the `Script`.

Note that, if the script fails to run, the deploy fails. And the `ApiStack` and the `DBStack` will not get deployed. In this case, you can fix the script, and deploy again.

### Running after deploy

Similarly, you can configure a `Script` to run at the end of the deployment, after all resources are deployed.

Create a `AfterDeployStack` in `stacks/index.js`.

```js title="stacks/index.js"
const apiStack = new ApiStack(app, "api");
const dbStack = new DBStack(app, "db");

const afterDeployStack = new AfterDeployStack(app, "after-deploy");

afterDeployStack.addDependency(apiStack);
afterDeployStack.addDependency(dbStack);
```

By making the `AfterDeployStack` depend on both `ApiStack` and `DBStack`, it will get deployed after the two stacks are done deploying.

Here we are making use of the idea of [Stack dependencies](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html#stack-dependencies) in CDK.

Then, let's add the script in the `AfterDeployStack`.

```js title="stacks/AfterDeployStack.js"
import { Stack, Script } from "@serverless-stack/resources";

export class AfterDeployStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    new Script(stack, "AfterDeploy", {
      onCreate: "src/script.create",
    });
  }
}
```

Now when you deploy this app, the `AfterDeployStack` will get deployed at the end and run the `Script`.

Note that, if the script fails to run, the entire deploy is marked as failed. And the updates made to the `ApiStack` and the `DBStack` will get rolled back. In this case, you can fix the script, and deploy again.

### Running multiple Scripts

Multiple scripts within the same Stack can run concurrently. You can manage the order in which they get run by specifying a dependency relationship.

```js {9}
const scriptA = new Script(stack, "Script", {
  onCreate: "src/scriptA.create",
});

const scriptB = new Script(stack, "Script", {
  onCreate: "src/scriptB.create",
});

scriptB.node.addDependency(scriptA);
```

In this case, `scriptB` will run after `scriptA` is completed.

Here we are making use of the idea of [Construct dependencies](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html#construct-dependencies) in CDK.

## ScriptProps



### defaults.function?

_Type_ : <span class="mono">[FunctionProps](Function#functionprops)</span>

The default function props to be applied to all the Lambda functions in the API. The `environment`, `permissions` and `layers` properties will be merged with per route definitions if they are defined.


```js
new Script(stack, "Api", {
  defaults: {
    function: {
      timeout: 20,
    }
  }
});
```


### onCreate?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span> | <span class="mono">[FunctionProps](Function#functionprops)</span></span>

Creates the function that runs when the Script is created.


```js
new Script(stack, "Api", {
  onCreate: "src/function.handler",
})
```

### onDelete?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span> | <span class="mono">[FunctionProps](Function#functionprops)</span></span>

Create the function that runs when the Script is deleted from the stack.


```js
new Script(stack, "Api", {
  onDelete: "src/function.handler",
})
```

### onUpdate?

_Type_ : <span class='mono'><span class="mono">string</span> | <span class="mono">[Function](Function#function)</span> | <span class="mono">[FunctionProps](Function#functionprops)</span></span>

Creates the function that runs on every deploy after the Script is created


```js
new Script(stack, "Api", {
  onUpdate: "src/function.handler",
})
```

### params?

_Type_ : <span class="mono">Record&lt;<span class="mono">string</span>, <span class="mono">any</span>&gt;</span>

An object of input parameters to be passed to the script. Made available in the `event` object of the function.


```js
import { Script } from "@serverless-stack/resources";

new Script(stack, "Script", {
  onCreate: "src/script.create",
  params: {
    hello: "world",
  },
});
```

## Properties
An instance of `Script` has the following properties.
### createFunction?

_Type_ : <span class="mono">[Function](Function#function)</span>

The internally created onCreate `Function` instance.

### deleteFunction?

_Type_ : <span class="mono">[Function](Function#function)</span>

The internally created onDelete `Function` instance.

### updateFunction?

_Type_ : <span class="mono">[Function](Function#function)</span>

The internally created onUpdate `Function` instance.

## Methods
An instance of `Script` has the following methods.
### attachPermissions

```ts
attachPermissions(permissions)
```
_Parameters_
- __permissions__ <span class="mono">[Permissions](Permissions)</span>


Grants additional permissions to the script


```js
script.attachPermissions(["s3"]);
```
