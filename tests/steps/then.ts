import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { DEV_DYNAMO_TABLE_NAME, DEV_REGION } from "../constants";
const ddbClient = new DynamoDBClient({ region: DEV_REGION });
export const user_exists_in_UsersTable = async (
  userSub: string
): Promise<any> => {
  let Item: unknown;
  console.log(
    `looking for user [${userSub}] in table [${DEV_DYNAMO_TABLE_NAME}]`
  );

  // Scan the table for cognitoUserId
  const scanResponse = await ddbClient.send(
    new ScanCommand({
      TableName: DEV_DYNAMO_TABLE_NAME, // enter your table name here
      FilterExpression: "cognitoUserId = :cognitoUserId",
      ExpressionAttributeValues: marshall({
        ":cognitoUserId": userSub,
      }),
    })
  );

  if (scanResponse.Items && scanResponse.Items.length > 0) {
    Item = unmarshall(scanResponse.Items[0]); // Get the first matching item
  }

  console.log("found item:", Item);
  expect(Item).toBeTruthy();
  return Item;
};
