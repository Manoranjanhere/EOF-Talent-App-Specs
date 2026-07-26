import { apiRequest } from "./api-client";

type LoginResponse = {
  user: {
    id: string;
    fullName: string;
    roles: number[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

type OtpSendResponse = {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  otpCode?: string;
};

export function loginByEmailPassword(payload: {
  email?: string;
  mobileNumber?: string;
  password: string;
}) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload
  });
}

export function sendRegistrationOtp(payload: { mobileNumber: string }) {
  return apiRequest<OtpSendResponse>("/auth/register/mobile-otp/send", {
    method: "POST",
    body: payload
  });
}

export function sendPasswordResetOtp(payload: { mobileNumber: string }) {
  return apiRequest<OtpSendResponse>("/auth/password/reset/otp/send", {
    method: "POST",
    body: payload
  });
}

export function resetPassword(payload: {
  mobileNumber: string;
  newPassword: string;
  firebaseIdToken?: string;
  otpCode?: string;
}) {
  return apiRequest<LoginResponse>("/auth/password/reset", {
    method: "POST",
    body: payload
  });
}

export function registerUser(payload: {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  groupId: number;
  firebaseIdToken?: string;
  otpCode?: string;
}) {
  return apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    body: payload
  });
}

export function refreshAccessToken(refreshToken: string) {
  return apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });
}
