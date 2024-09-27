import * as cdk from "aws-cdk-lib";
import { aws_dynamodb as dynamodb } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CDKContext } from "../types";

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.TableV2;

  constructor(
    scope: Construct,
    id: string,
    context: CDKContext,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    this.table = this.createTable(context);
    this.output();
  }

  createTable(context: CDKContext): dynamodb.TableV2 {
    const table = new dynamodb.TableV2(this, `${context.environment}-Table`, {
      tableName: `${context.environment}-table-${context.appName}`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: context.destroyPolicy
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });

    return table;
  }

  output() {
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB Table Name",
    });

    new cdk.CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      description: "DynamoDB Table ARN",
    });
  }
}
