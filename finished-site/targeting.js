// PLACE YOUR LAUNCHDARKLY CLIENT SIDE ID HERE
const LAUNCHDARKLY_CLIENT_ID = "64d5441470442b1368e8c800";
// PLACE YOUR USERPOOLID AND CLIENTID HERE
const POOL_DATA = {
  UserPoolId: "us-west-2_HwyREvjAv",
  ClientId: "6mc3bd1g86bfneack1agbhina6",
};

// LAUNCHDARKLY CODE GOES HERE

// INITIALIZE THE CLIENT WITH AN ANONYMOUS USER CONTEXT
const anonymousUser = {
  kind: "user",
  key: "anonymous",
};
const client = LDClient.initialize(LAUNCHDARKLY_CLIENT_ID, anonymousUser);

// WAIT FOR THE READY EVENT AND THEN GET THE VARIATION
client.on("ready", () => {
  // GET THE PLAN PRICING FROM LAUNCHDARKLY
  const planPricing = client.variation("plan-pricing", {
    enterprise: "TBD",
    starter: "TBD",
  });
  updatePricing(planPricing);

  // update when the flag is changed
  client.on("change:plan-pricing", updatePricing);
});

const userPool = new AmazonCognitoIdentity.CognitoUserPool(POOL_DATA);

async function registerNewUser(username, password, dev_type) {
  let attributeList = [];
  const dataDevType = {
    Name: "custom:dev_type",
    Value: dev_type,
  };
  const attributeDevType = new AmazonCognitoIdentity.CognitoUserAttribute(
    dataDevType
  );
  attributeList.push(attributeDevType);
  await userPool.signUp(
    username,
    password,
    attributeList,
    null,
    function (err, result) {
      if (err) {
        alert(err.message || JSON.stringify(err));
        return;
      }
      let user = result.user;
      result.user.authenticateUser(
        new AmazonCognitoIdentity.AuthenticationDetails({
          Username: email,
          Password: password,
        }),
        {
          onSuccess: function (result) {
            handleUserResponse(user);
          },

          onFailure: function (err) {
            alert(err.message || JSON.stringify(err));
          },
        }
      );
    }
  );
}

async function deleteExistingUser() {
  if (cognitoUser) {
    cognitoUser.deleteUser(async function (err, result) {
      if (err) {
        alert(err.message || JSON.stringify(err));
        return;
      }
      console.log("user deleted");
      cognitoUser = null;
      // reset the user in LaunchDarkly
      if (client) await client.identify({ type: "user", key: "anonymous" });
      // return to the initial state
      showDefaultState();
    });
  }
}

function handleUserResponse(user) {
  console.log("user created");
  cognitoUser = user;
  cognitoUser.getUserAttributes(async function (err, result) {
    if (err) {
      alert(err.message || JSON.stringify(err));
      return;
    }

    // convert the cognito data to a user structure
    let ldUser = convertCognitoUserToLaunchDarkly(result);
    // if launchdarkly is defined and the returned LaunchDarkly user is valid
    if (client && ldUser.key.length > 0) {
      await client.identify(ldUser);
    }
  });
  // hide the account form and login button
  showDefaultState();
}

// this is a helper function to simplify the steps for the Jam challenge
function convertCognitoUserToLaunchDarkly(user) {
  // this is the structure we need
  let ldUser = {
    kind: "user",
    key: "",
    dev_type: "",
  };

  for (i = 0; i < user.length; i++) {
    if (user[i].getName() == "email") {
      ldUser.key = user[i].getValue();
    }
    if (user[i].getName() == "custom:dev_type") {
      ldUser.dev_type = user[i].getValue();
    }
  }
  return ldUser;
}
