import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";

interface HikvisionConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface DigestAuthParams {
  realm: string;
  nonce: string;
  qop?: string;
  opaque?: string;
  algorithm?: string;
}

export class HikvisionClient {
  private config: HikvisionConfig;

  constructor(baseUrl: string, username: string, password: string) {
    this.config = {
      baseUrl: baseUrl.replace(/\/$/, ""),
      username,
      password,
    };
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" = "GET",
    body?: string,
    isRetry = false,
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/xml",
      },
      body,
    });

    if (response.status === 401 && !isRetry) {
      const wwwAuth = response.headers.get("www-authenticate");
      if (wwwAuth && wwwAuth.includes("Digest")) {
        const authHeader = this.generateDigestAuth(method, endpoint, wwwAuth);
        return fetch(url, {
          method,
          headers: {
            "Content-Type": "application/xml",
            Authorization: authHeader,
          },
          body,
        });
      }
    }

    return response;
  }

  private generateDigestAuth(
    method: string,
    uri: string,
    wwwAuth: string,
  ): string {
    const params = this.parseDigestAuth(wwwAuth);
    const ha1 = this.md5(
      `${this.config.username}:${params.realm}:${this.config.password}`,
    );
    const ha2 = this.md5(`${method}:${uri}`);

    let response: string;
    if (params.qop === "auth" || params.qop === "auth-int") {
      const nc = "00000001";
      const cnonce = this.generateCnonce();
      response = this.md5(
        `${ha1}:${params.nonce}:${nc}:${cnonce}:${params.qop}:${ha2}`,
      );

      return `Digest username="${this.config.username}", realm="${params.realm}", nonce="${params.nonce}", uri="${uri}", qop=${params.qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"${params.opaque ? `, opaque="${params.opaque}"` : ""}`;
    } else {
      response = this.md5(`${ha1}:${params.nonce}:${ha2}`);
      return `Digest username="${this.config.username}", realm="${params.realm}", nonce="${params.nonce}", uri="${uri}", response="${response}"${params.opaque ? `, opaque="${params.opaque}"` : ""}`;
    }
  }

  private parseDigestAuth(wwwAuth: string): DigestAuthParams {
    const params: any = {};
    const regex = /(\w+)[:=]\s*"?([^",]+)"?/g;
    let match;

    while ((match = regex.exec(wwwAuth)) !== null) {
      params[match[1]] = match[2];
    }

    return params;
  }

  private md5(str: string): string {
    return createHash("md5").update(str).digest("hex");
  }

  private generateCnonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async getDeviceInfo(): Promise<any> {
    const response = await this.makeRequest("/ISAPI/System/deviceInfo");
    const text = await response.text();
    return this.parseXmlResponse(text);
  }

  async getSystemStatus(): Promise<any> {
    const response = await this.makeRequest("/ISAPI/System/status");
    const text = await response.text();
    return this.parseXmlResponse(text);
  }

  async getSnapshot(channel: number = 1): Promise<Buffer> {
    const response = await this.makeRequest(
      `/ISAPI/Streaming/channels/${channel}/picture`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get snapshot: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  getRtspUrl(channel: number = 1, streamType: "main" | "sub" = "main"): string {
    const streamId = streamType === "main" ? `${channel}01` : `${channel}02`;
    const port = 554;
    const host = this.config.baseUrl.replace(/^https?:\/\//, "");
    return `rtsp://${this.config.username}:${this.config.password}@${host}:${port}/Streaming/Channels/${streamId}`;
  }

  getHttpPreviewUrl(
    channel: number = 1,
    streamType: "main" | "sub" = "main",
  ): string {
    const streamId = streamType === "main" ? `${channel}01` : `${channel}02`;
    return `${this.config.baseUrl}/ISAPI/Streaming/channels/${streamId}/httpPreview`;
  }

  async searchRecordings(
    startTime: Date,
    endTime: Date,
    channel: number = 1,
  ): Promise<any> {
    const searchXml = `<?xml version="1.0" encoding="UTF-8"?>
<CMSearchDescription>
  <searchID>C${Date.now()}</searchID>
  <trackList>
    <trackID>${channel}01</trackID>
  </trackList>
  <timeSpanList>
    <timeSpan>
      <startTime>${this.formatDateTime(startTime)}</startTime>
      <endTime>${this.formatDateTime(endTime)}</endTime>
    </timeSpan>
  </timeSpanList>
  <maxResults>40</maxResults>
  <searchResultPosition>0</searchResultPosition>
  <metadataList>
    <metadataDescriptor>motion</metadataDescriptor>
  </metadataList>
</CMSearchDescription>`;

    const response = await this.makeRequest(
      "/ISAPI/ContentMgmt/search",
      "POST",
      searchXml,
    );
    const text = await response.text();
    return this.parseXmlResponse(text);
  }

  getPlaybackUrl(startTime: Date, endTime: Date, channel: number = 1): string {
    const trackId = `${channel}01`;
    const start = this.formatDateTime(startTime);
    const end = this.formatDateTime(endTime);
    const host = this.config.baseUrl.replace(/^https?:\/\//, "");
    return `rtsp://${this.config.username}:${this.config.password}@${host}:554/Streaming/tracks/${trackId}?starttime=${start}&endtime=${end}`;
  }

  async checkCameraStatus(): Promise<{ online: boolean; lastOnline?: Date }> {
    try {
      const response = await this.makeRequest("/ISAPI/System/status");
      if (response.ok) {
        return { online: true, lastOnline: new Date() };
      }
      return { online: false };
    } catch (error) {
      return { online: false };
    }
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private parseXmlResponse(xml: string): any {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "_text",
      parseAttributeValue: true,
      trimValues: true,
    });

    try {
      return parser.parse(xml);
    } catch (error) {
      console.error("XML parsing error:", error);
      return {};
    }
  }
}
