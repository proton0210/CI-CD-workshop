#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { ComputeStack } from "../lib/compute-stack";
import { AuthStack } from "../lib/auth-stack";
import { DatabaseStack } from "../lib/database-stack";
import { getContext } from "../utils/context";

const createStacks = async () => {
  try {
    const app = new cdk.App();
    const context = await getContext(app);
    const tags = {
      Environment: context.environment,
    };
    const stackProps: cdk.StackProps = {
      env: {
        account: context.accountNumber,
        region: context.region,
      },
      tags,
    };

    // Create DatabaseStack
    const databaseStack = new DatabaseStack(
      app,
      `${context.appName}-database-stack-${context.environment}`,
      context,
      {
        ...stackProps,
        stackName: `${context.appName}-database-stack-${context.environment}`,
        description: `Database stack for ${context.appName}`,
      }
    );

    // Create ComputeStack
    const computeStack = new ComputeStack(
      app,
      `${context.appName}-compute-stack-${context.environment}`,
      context,
      {
        ...stackProps,
        stackName: `${context.appName}-compute-stack-${context.environment}`,
        description: `Compute stack for ${context.appName}`,
        table: databaseStack.table,
      }
    );

    // Create AuthStack
    const authStack = new AuthStack(
      app,
      `${context.appName}-auth-stack-${context.environment}`,
      context,
      {
        ...stackProps,
        stackName: `${context.appName}-auth-stack-${context.environment}`,
        description: `Auth stack for ${context.appName}`,
        addUserPostConfirmation: computeStack.postConfirmationFunction,
      }
    );
  } catch (error) {
    console.error("Error creating stacks:", error);
    process.exit(1);
  }
};

createStacks();
