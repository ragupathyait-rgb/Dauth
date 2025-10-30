// services/authService.js
import axios from "axios";
import { contractCall } from "../web3helper/web3helper";
import userContract from "../web3/userContract.json";
import config from "../web3/web3Config.json"

const API_URL = import.meta.env.VITE_API_URL;

export function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generateCodeVerifier() {
  const random = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(random);
}

export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export function saveTokens(tokens) {
  localStorage.setItem("tokens", JSON.stringify(tokens));
}

export function getTokens() {
  const raw = localStorage.getItem("tokens");
  return raw ? JSON.parse(raw) : null;
}

export function clearTokens() {
  localStorage.removeItem("tokens");
}

export function isAuthenticated() {
  return !!getTokens()?.access_token;
}

export function getAuthHeader() {
  const t = getTokens();
  return t?.access_token ? { Authorization: `Bearer ${t.access_token}` } : {};
}

export async function exchangeCodeForTokens({ code, client_id, code_verifier, client_secret }) {
  const res = await axios.post(`${API_URL}/oauth/token`, {
    grant_type: "authorization_code",
    code,
    client_id,
    code_verifier,
    client_secret,
  });
  return res.data;
}

export async function requestWalletChallenge({ client_id, redirect_uri, state, code_challenge, code_challenge_method }) {
  const res = await axios.post(`${API_URL}/wallet/challenge`, {
    client_id, redirect_uri, state, code_challenge, code_challenge_method
  });
  return res.data; // { challenge }
}

export async function verifyWalletSignature({ walletAddress, publicKey, signature, client_id, redirect_uri, state }) {
  const res = await axios.post(`${API_URL}/wallet/verify`, {
    walletAddress, publicKey, signature, client_id, redirect_uri, state
  });
  return res.data; // { code, redirect_uri, state }
}

export async function getSignature(msg) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!window?.ncogProvider) {
      return null;
    }
    const signatureData = await window.ncogProvider.request({ method: 'ncog_personalSign', params: { userMessage: msg } });
    console.log("Signature Data:", signatureData);
    return signatureData?.response?.signature;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getWallet() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (!window?.ncogProvider) {
    return null;
  }
  console.log("Getting wallet...");
  const account = await window.ncogProvider.request({ method: 'ncog_accounts' });
  if (!account?.selectedAccount) {
    return null;
  }
  return account.selectedAccount;
}

export const getUserContract = () => {
    const hostContractMethod = contractCall(userContract.contract, config.USER_REGISTRY_CONTRACT);
    return hostContractMethod;
}