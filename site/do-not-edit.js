// This file contains functions that are used to modify the site content and should not be edited.

// show the pricing information state
function showDefaultState() {
  const accountEl = document.getElementById("createAccountSection");
  const mainEl = document.getElementById("mainContent");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // remove required attributes to avoid validation errors
  emailInput.removeAttribute("required");
  passwordInput.removeAttribute("required");
  // hide the create account
  accountEl.classList.add("hidden");
  // show the pricing content
  mainEl.classList.remove("hidden");

  // if they aren't logged in and the flag is on, show the login button
  if (!cognitoUser && loginEnabled) {
    showOrHideLoginButton(true);
  } else {
    showOrHideLoginButton(false);
  }
  // if they are logged in, show the reset button
  if (cognitoUser) {
    showOrHideResetButton(true);
  } else {
    showOrHideResetButton(false);
  }
}

// hide or display elements on the page to allow the user to create an account
function showLoginState() {
  const accountEl = document.getElementById("createAccountSection");
  const mainEl = document.getElementById("mainContent");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // reset the fields to required
  emailInput.setAttribute("required", true);
  passwordInput.setAttribute("required", true);
  // show the create account
  accountEl.classList.remove("hidden");
  // hide the pricing content
  mainEl.classList.add("hidden");
  // hide the reset button
  showOrHideResetButton(false);
}

function showOrHideResetButton(val) {
  const resetEl = document.getElementById("resetButton");

  if (val) {
    resetEl.classList.remove("hidden");
  } else {
    resetEl.classList.add("hidden");
  }
}

let loginEnabled = false;
function setLoginEnabled(val) {
  loginEnabled = val;
  showOrHideLoginButton(val);
}

function showOrHideLoginButton(val) {
  const loginEl = document.getElementById("loginButton");

  if (val) {
    loginEl.classList.remove("hidden");
  } else {
    loginEl.classList.add("hidden");
  }
}

// hide or show the pricing cards based upon the pricing data returned from LaunchDarkly
function updatePricing(pricing) {
  const pricingCards = document.getElementById("pricingCards");
  const starterCard = document.getElementById("starterCard");
  const starterPricing = document.getElementById("starterPricing");
  const companyCard = document.getElementById("companyCard");
  const companyPricing = document.getElementById("companyPricing");
  const enterpriseCard = document.getElementById("enterpriseCard");
  const enterprisePricing = document.getElementById("enterprisePricing");

  if (pricing.starter) {
    starterCard.classList.remove("hidden");
    starterPricing.innerHTML = pricing.starter;
  } else {
    starterCard.classList.add("hidden");
  }
  if (pricing.company) {
    companyCard.classList.remove("hidden");
    companyPricing.innerHTML = pricing.company;
  } else {
    companyCard.classList.add("hidden");
  }
  if (pricing.enterprise) {
    enterpriseCard.classList.remove("hidden");
    enterprisePricing.innerHTML = pricing.enterprise;
  } else {
    enterpriseCard.classList.add("hidden");
  }

  // adjust the grid columns
  pricingCards.classList.remove("lg:grid-cols-3");
  pricingCards.classList.remove("lg:grid-cols-2");
  pricingCards.classList.add("lg:grid-cols-" + Object.keys(pricing).length);
}

// handle the form submission
const accountForm = document.getElementById("accountForm");
accountForm.onsubmit = async function (event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const dev_type = document.getElementById("dev_type").value;
  console.log(dev_type);
  if (dev_type === "You are a...") {
    alert("Please choose a developer type");
    return;
  }
  await registerNewUser(email, password, dev_type);
};

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
