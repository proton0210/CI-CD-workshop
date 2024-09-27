/**
 * Auth Stack to create Cognito User Pool and User Pool Client
 */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_cognito as Cognito } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CDKContext } from "../types";

interface AuthStackProps extends cdk.StackProps {
  addUserPostConfirmation: NodejsFunction;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: Cognito.UserPool;
  public readonly userPoolClient: Cognito.UserPoolClient;

  constructor(
    scope: Construct,
    id: string,
    context: CDKContext,
    props: AuthStackProps
  ) {
    super(scope, id, props);

    this.userPool = this.createUserPool(props, context);
    this.userPoolClient = this.createWebClient(context);
    this.output();
  }

  createUserPool(props: AuthStackProps, context: CDKContext) {
    const userPool = new Cognito.UserPool(
      this,
      `${context.environment}-UserPool`,
      {
        userPoolName: `${context.environment}-user-pool-${context.appName}`,
        selfSignUpEnabled: true,
        autoVerify: { email: true },
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
        signInAliases: { email: true },
        standardAttributes: {
          email: { required: true, mutable: true },
        },
        customAttributes: {
          firstName: new Cognito.StringAttribute({ minLen: 1, maxLen: 50 }),
          lastName: new Cognito.StringAttribute({ minLen: 1, maxLen: 50 }),
          userTier: new Cognito.StringAttribute({ mutable: true }),
          subscriptionEndDate: new Cognito.DateTimeAttribute(),
        },
        lambdaTriggers: {
          postConfirmation: props.addUserPostConfirmation,
          preTokenGeneration: props.addUserPostConfirmation,
        },
        accountRecovery: Cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: context.destroyPolicy
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
      }
    );

    return userPool;
  }

  createWebClient(context: CDKContext) {
    const client = new Cognito.UserPoolClient(
      this,
      `${context.environment}-UserPoolClient`,
      {
        userPool: this.userPool,

        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      }
    );

    return client;
  }

  output() {
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "User Pool Client ID",
    });
  }
}
