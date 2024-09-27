import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { CDKContext } from "../types";

interface ComputeStackProps extends cdk.StackProps {
  table: TableV2;
}

export class ComputeStack extends cdk.Stack {
  public readonly postConfirmationFunction: lambda.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    context: CDKContext,
    props: ComputeStackProps
  ) {
    super(scope, id, props);

    this.postConfirmationFunction = this.createPostConfirmationFunction(
      context,
      props.table
    );
    this.output();
  }

  createPostConfirmationFunction(
    context: CDKContext,
    table: TableV2
  ): lambda.NodejsFunction {
    const postConfirmation = new lambda.NodejsFunction(
      this,
      `${context.environment}-PostConfirmationFunction`,
      {
        functionName: `${context.environment}-post-confirmation-${context.appName}`,
        entry: path.join(
          __dirname,
          "functions",
          "PostConfirmation",
          "handler.ts"
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: table.tableName,
        },
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
      }
    );

    table.grantReadWriteData(postConfirmation);

    postConfirmation.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminListGroupsForUser",
        ],
        resources: ["*"],
      })
    );
    return postConfirmation;
  }

  output() {
    new cdk.CfnOutput(this, "PostConfirmationFunctionName", {
      value: this.postConfirmationFunction.functionName,
      description: "Post Confirmation Lambda Function Name",
    });

    new cdk.CfnOutput(this, "PostConfirmationFunctionArn", {
      value: this.postConfirmationFunction.functionArn,
      description: "Post Confirmation Lambda Function ARN",
    });
  }
}
