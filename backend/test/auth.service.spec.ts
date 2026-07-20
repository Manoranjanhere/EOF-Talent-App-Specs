import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

jest.mock("../src/modules/auth/firebase-admin.service", () => ({
  FirebaseAdminService: class FirebaseAdminService {
    isConfigured() {
      return false;
    }
    verifyPhoneIdToken() {
      return Promise.reject(new Error("Firebase not configured in tests"));
    }
  }
}));

import { AuthService } from "../src/modules/auth/auth.service";

describe("AuthService", () => {
  const prismaMock: any = {
    userAccount: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  };
  const jwtMock: any = { sign: jest.fn().mockReturnValue("token") };
  const configMock: any = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: "access",
        JWT_REFRESH_SECRET: "refresh",
        JWT_ACCESS_EXPIRES: "15m",
        JWT_REFRESH_EXPIRES: "30d",
        OTP_TEST_BYPASS: "false"
      };
      return values[key];
    })
  };
  const firebaseMock: any = {
    isConfigured: jest.fn().mockReturnValue(false),
    verifyPhoneIdToken: jest.fn()
  };

  const audit = { ip: "127.0.0.1", updatedBy: "test" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in with valid password", async () => {
    const service = new AuthService(prismaMock, jwtMock, configMock, firebaseMock);
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "user-1",
      fullName: "Test User",
      email: "test@example.com",
      mobileNumber: "+919999999999",
      passwordHash: await bcrypt.hash("Password123", 10),
      loginEnabled: true,
      isActive: true,
      loginAttempts: 0,
      roles: [{ groupId: 1 }]
    });
    prismaMock.userAccount.update.mockResolvedValue({});

    const result = await service.login(
      { email: "test@example.com", password: "Password123" },
      audit
    );

    expect(result.tokens.accessToken).toBe("token");
    expect(result.user.roles).toEqual([1]);
  });

  it("rejects locked account", async () => {
    const service = new AuthService(prismaMock, jwtMock, configMock, firebaseMock);
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "user-2",
      passwordHash: "hash",
      loginEnabled: true,
      isActive: true,
      loginAttempts: 3,
      roles: [{ groupId: 1 }]
    });

    await expect(
      service.login({ email: "user2@example.com", password: "Password123" }, audit)
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
