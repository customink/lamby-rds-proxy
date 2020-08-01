import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
import * as secrets from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";
import { assert } from "console";
const VPC_ID = process.env.VPC_ID;
const DB_NAME = process.env.DB_NAME || "myapp";
const DB_USERNAME = "root";

export class MyRdsProxyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Uses Existing VPC
    assert(VPC_ID, "Must pass a VPC_ID environment variable!");
    const vpc = ec2.Vpc.fromLookup(this, "VPC", { vpcId: VPC_ID });

    // RDS Master Credentials in Secrets Manager
    const creds = new secrets.Secret(this, "DbCredentials", {
      secretName: `${DB_NAME}-credentials`,
      description: `RDS Master Credentials for ${DB_NAME}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: DB_USERNAME,
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: "password",
      },
    });

    const PASSWORD = creds.secretValueFromJson("password");

    // MySQL DB Instance
    const instance = new rds.DatabaseInstance(this, "DbInstanc", {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_7,
      }),
      instanceIdentifier: DB_NAME,
      databaseName: DB_NAME,
      masterUsername: DB_USERNAME,
      masterUserPassword: PASSWORD,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      vpcPlacement: { subnetType: ec2.SubnetType.PUBLIC },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));

    // RDS Proxy
    const proxy = new rds.DatabaseProxy(this, "DbProxy", {
      dbProxyName: `${DB_NAME}-proxy`,
      secrets: [creds],
      debugLogging: false,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      proxyTarget: rds.ProxyTarget.fromInstance(instance),
    });
    proxy.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));

    // RDS Proxy DATABASE_URL in SSM Parameter Store
    const dbUrl = new ssm.StringParameter(this, "DatabaseUrl", {
      allowedPattern: ".*",
      description: `RDS Proxy DATABASE_URL for ${DB_NAME}`,
      parameterName: `${DB_NAME}-dburl`,
      stringValue: `mysql2://${DB_USERNAME}:${PASSWORD}@${proxy.endpoint}/${DB_NAME}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    // Outputs
    new cdk.CfnOutput(this, "MyDbCredentialsArn", {
      value: creds.secretArn,
    });
    new cdk.CfnOutput(this, "MyDbProxyDbUrlParameterName", {
      value: dbUrl.parameterName,
    });
    new cdk.CfnOutput(this, "MyDbInstancEndpoint", {
      value: instance.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, "MyDbProxyEndpoint", {
      value: proxy.endpoint,
    });
  }
}
