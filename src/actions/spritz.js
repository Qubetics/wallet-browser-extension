export const spritzLogin = (user) => ({
  type: "SPRITZ_LOGIN",
  payload: user,
});

export const spritzKyc = (status) => ({
  type: "SPRITZ_KYC",
  payload: status,
});

export const spritzAccounts = (accounts) => ({
  type: "SPRITZ_ACCOUNTS",
  payload: accounts,
});

