import {
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "ulid";

const dynamoDb = new DynamoDBClient({});
const cognitoIdentityProvider = new CognitoIdentityProviderClient({});

import { PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda";

// Update the function signature to use the extended type
exports.handler = async function (
  event: PostConfirmationConfirmSignUpTriggerEvent
): Promise<PostConfirmationConfirmSignUpTriggerEvent> {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const { userName } = event;
  const { email, given_name, family_name } = event.request.userAttributes;
  let userId: string;

  try {
    // Store user in DynamoDB
    userId = (await storeUserInDynamoDB(
      event,
      userName,
      email,
      given_name,
      family_name
    )) as string;
    if (!userId) throw new Error("Error gettign User Id");

    // Add the userId to the event's response object

    console.log(
      `User ${userName} successfully processed and stored in DynamoDB with userId: ${userId}`
    );
  } catch (error) {
    console.error("Error processing user:", error);
    throw error; // Rethrow the error to fail the Lambda execution
  }

  // Return the modified event
  return event;
};

async function storeUserInDynamoDB(
  event: PostConfirmationConfirmSignUpTriggerEvent,
  cognitoUserId: string,
  email: string,
  firstName: string | undefined,
  lastName: string | undefined
): Promise<string | void> {
  const userId = ulid();
  const now = new Date().toISOString();

  const item = {
    PK: `USER#${userId}`,
    SK: `METADATA#${userId}`,
    cognitoUserId,
    email,
    firstName: firstName || event.request.userAttributes["custom:firstName"],
    lastName: lastName || event.request.userAttributes["custom:lastName"],
    userTier: "Free",
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME!,
    Item: marshall(item, { removeUndefinedValues: true }),
    ConditionExpression: "attribute_not_exists(PK)",
  });

  try {
    await dynamoDb.send(command);
    return userId;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      console.log("User already exists in DynamoDB");
    } else {
      throw error;
    }
  }
}
