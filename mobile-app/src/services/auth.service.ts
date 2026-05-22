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

export function loginByMobileOtp(payload: {
  mobileNumber: string;
  otpCode: string;
}) {
  return apiRequest<LoginResponse>("/auth/login/mobile-otp", {
    method: "POST",
    body: payload
  });
}

export function registerUser(payload: {
  fullName: string;
  email?: string;
  mobileNumber?: string;
  password: string;
  groupId: number;
}) {
  return apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    body: payload
  });
}
