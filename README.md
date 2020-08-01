# My CDK RDS Proxy

<a href="https://github.com/customink/lamby"><img src="https://user-images.githubusercontent.com/2381/59363668-89edeb80-8d03-11e9-9985-2ce14361b7e3.png" alt="Lamby: Simple Rails & AWS Lambda Integration using Rack." align="right" width="300" /></a>Lovingly copied from [CDK Patterns](https://cdkpatterns.com) from their [RDS Proxy](https://github.com/cdk-patterns/serverless/tree/master/the-rds-proxy/typescript) section for learning how to use [Lamby with Database Connections](https://lamby.custominktech.com/docs/database_connections). Includes the following changes:

- Usage of Docker to encapsulate the project.
- Removed API Gateway & Lambda resources.
- Pass your VPC ID via the `VPC_ID` environment variable.

⚠️WARNING⚠️ Pay attention to your AWS bill. These resources are not free. Also, these resources are provided for easy use and learning purposes and do not follow many security best practices. For example, we recommend changing:

- Changing the subnets from `PUBLIC` to `PRIVATE`.
- Locking down the security groups.
- Create distinct root and user accounts.
- Use a SecureString type in SSM.

## Bootstrap & Setup

All that is needed is Docker and your AWS account setup. This will install the Docker container and run `npm setup`.

```shell
$ ./bin/bootstrap
$ ./bin/setup
```

## Deploy Your RDS Proxy

Please export the `VPC_ID` variable. Most AWS accounts have a default VPC and the ID can be found by navigating to Services -> VPC within the AWS Console. If needed, you can create a new VPC using this [My CDK VPC](https://github.com/customink/lamby-vpc) project.

Optionally, you can export or pass an `AWS_PROFILE` (defaults to "default") environment variable. This will automatically set the `CDK_DEFAULT_ACCOUNT` value. Likewise, you can pass or export `AWS_DEFAULT_REGION` (defaults to us-east-1) too.

```shell
$ DB_NAME=myapp VPC_ID=vpc-01a23b45c67d89e01 ./bin/deploy
```

## Test Your Connection

The stack's outputs will contain the following information.

- `MyDbCredentialsArn`
- `MyDbProxyDbUrlParameterName`
- `MyDbInstancEndpoint`
- `MyDbProxyEndpoint`

Using the `MyDbCredentialsArn` value you can view your new `root` username & password by running the following command or by viewing it in the AWS Console under Secrets Manager.

```shell
$ aws secretsmanager get-secret-value \
  --secret-id "arn:aws:secretsmanager:..." \
  --query SecretString \
  --output text
```

Since this stack is created in your public subnets, you can use your favorite RDMBS tool like [MySQL Workbench](https://www.mysql.com/products/workbench/) to connect to your RDS instance using the `MyDbInstancEndpoint` output.
