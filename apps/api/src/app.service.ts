import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "keo-the-thao-api",
      timestamp: new Date().toISOString()
    };
  }
}

