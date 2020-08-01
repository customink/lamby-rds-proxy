#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { MyRdsProxyStack } from "../lib/my-rds-proxy-stack";

const app = new cdk.App();
new MyRdsProxyStack(app, "MyRdsProxyStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
