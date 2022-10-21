import { nativeProviders } from "@acme/constants";
import * as AuthSession from "expo-auth-session";
import { getSignInInfo, SigninResult } from "next-auth/expo";
import { Alert } from "react-native";

export const signinGithub = async (): Promise<SigninResult | null> => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true }); // https://auth.expo.io
  const provider = nativeProviders.github;
  const signinInfo = await getSignInInfo({ provider, proxyRedirectUri });
  if (!signinInfo) {
    Alert.alert("Error", "Couldn't get sign in info from server");
    return null;
  }
  const { state, codeChallenge, stateEncrypted, codeVerifier, clientId } =
    signinInfo;

  // This corresponds to useLoadedAuthRequest
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ["read:user", "user:email", "openid"],
    redirectUri: proxyRedirectUri,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  });
  const discovery = {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    revocationEndpoint:
      "https://github.com/settings/connections/applications/XXXXXXXXXXX", // ignore this, it should be set to a clientId.
  };

  request.state = state;
  request.codeChallenge = codeChallenge;
  await request.makeAuthUrlAsync(discovery);
  console.log(request.url);

  // useAuthRequestResult
  const result = await request.promptAsync(discovery, { useProxy: true });
  return {
    result,
    state,
    stateEncrypted,
    codeVerifier,
    provider,
  };
};
