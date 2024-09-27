import * as cdk from "aws-cdk-lib";
import { CDKContext } from "../types";
import { exec } from "child_process";

const getBranch = () =>
  new Promise((resolve, reject) => {
    return exec("git rev-parse --abbrev-ref HEAD", (err, stdout, stderr) => {
      if (err) reject(`getBranch Error: ${err}`);
      else if (typeof stdout === "string") resolve(stdout.trim());
    });
  });
export const getContext = async (app: cdk.App): Promise<CDKContext> => {
  try {
    const currentBranch = await getBranch();
    console.log(`Current branch: ${currentBranch}`);

    const environment = app.node
      .tryGetContext("environments")
      .find((env: any) => env.branchName === currentBranch);
    console.log(`Environment:`);
    console.log(JSON.stringify(environment, null, 2));

    const globals = app.node.tryGetContext("globals");
    console.log(`Globals:`);
    console.log(JSON.stringify(globals, null, 2));

    return {
      ...globals,
      ...environment,
    };
  } catch (error) {
    throw error;
  }
};
