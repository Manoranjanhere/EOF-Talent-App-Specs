import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SendMobileOtpDto } from "./dto/send-mobile-otp.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

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

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("register/mobile-otp/send")
  sendRegistrationOtp(@Body() dto: SendMobileOtpDto) {
    return this.authService.sendRegistrationOtp(dto);
  }

  @Post("password/reset/otp/send")
  sendPasswordResetOtp(@Body() dto: SendMobileOtpDto) {
    return this.authService.sendPasswordResetOtp(dto);
  }

  @Post("password/reset")
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.authService.resetPassword(dto, audit);
  }
}
