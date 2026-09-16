import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export interface CurrentUserPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  verificationStatus: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);
