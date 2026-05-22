import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";

describe("App smoke", () => {
  it("builds Nest application module", async () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

    const testingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    expect(testingModule).toBeDefined();
    await testingModule.close();
  });
});
