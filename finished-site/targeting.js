// PLACE YOUR LAUNCHDARKLY CLIENT SIDE ID HERE
const LAUNCHDARKLY_CLIENT_ID = "YOUR_CLIENT_ID";
// PLACE YOUR USERPOOLID AND CLIENTID HERE
const POOL_DATA = {
  UserPoolId: "us-west-1_rdEQKAPba",
  ClientId: "2fbn2u0at4mmptsd7gdiec8833",
};

// LAUNCHDARKLY CODE GOES HERE

// INITIALIZE THE CLIENT
const ldClient = LDClient.initialize("LAUNCHDARKLY_CLIENT_ID", {
  kind: "user",
  key: "anonymous",
});

// WAIT FOR THE READY EVENT AND THEN GET THE VARIATION
ldClient.on("ready", () => {
  // show the login button?
  const enableLogin = ldClient.variation("show-login-button", false);
  setLoginEnabled(enableLogin);
  ldClient.on("change:show-login-button", setLoginEnabled);

  const planPricing = ldClient.variation("plan-pricing", false);
  updatePricing(planPricing);
  ldClient.on("change:plan-pricing", updatePricing);
});

const userPool = new AmazonCognitoIdentity.CognitoUserPool(POOL_DATA);
let cognitoUser;

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
      if (ldClient) await ldClient.identify({ type: "user", key: "anonymous" });
      // return to the initial state
      showDefaultState();
    });
  }
}

function handleUserResponse(user) {
  console.log("user created");
  // document.cookie = `cognitoUser=${JSON.stringify(user)}`;
  cognitoUser = user;
  cognitoUser.getUserAttributes(async function (err, result) {
    if (err) {
      alert(err.message || JSON.stringify(err));
      return;
    }

    // convert the cognito data to a user structure
    let ldUser = convertCognitoUserToLaunchDarkly(result);
    // if launchdarkly is defined and the returned LaunchDarkly user is valid
    if (ldClient && ldUser.key.length > 0) {
      await ldClient.identify(ldUser);
    }
  });
  // hide the account form and login button
  showDefaultState();
}
