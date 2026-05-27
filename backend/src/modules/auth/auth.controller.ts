import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { MobileOtpLoginDto } from "./dto/mobile-otp-login.dto";
import { SendMobileOtpDto } from "./dto/send-mobile-otp.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(
    @Body() dto: RegisterDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.authService.register(dto, audit);
  }

  @Post("login")
  login(
    @Body() dto: LoginDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.authService.login(dto, audit);
  }

  @Post("login/mobile-otp")
  loginWithMobileOtp(
    @Body() dto: MobileOtpLoginDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.authService.loginWithMobileOtp(dto, audit);
  }

  @Post("login/mobile-otp/send")
  sendMobileOtp(@Body() dto: SendMobileOtpDto) {
    return this.authService.sendMobileOtp(dto);
  }
}
