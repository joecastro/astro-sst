import { describe, expect, it } from "vitest";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  CloudFrontRequestEvent,
} from "aws-lambda";
import { convertFrom, convertTo } from "../src/lib/event-mapper";

describe("convertFrom", () => {
  it("normalizes API Gateway v2 events", () => {
    const event = {
      version: "2.0",
      routeKey: "$default",
      rawPath: "/docs",
      rawQueryString: "page=2",
      cookies: ["theme=dark", "session=abc"],
      headers: {
        host: "internal.example.com",
        "x-forwarded-host": "docs.example.com",
        "x-forwarded-protocol": "https",
      },
      requestContext: {
        accountId: "123456789012",
        apiId: "api-id",
        domainName: "docs.example.com",
        domainPrefix: "docs",
        http: {
          method: "POST",
          path: "/docs",
          protocol: "HTTP/1.1",
          sourceIp: "203.0.113.10",
          userAgent: "Vitest",
        },
        requestId: "request-id",
        routeKey: "$default",
        stage: "$default",
        time: "01/Jan/2026:00:00:00 +0000",
        timeEpoch: 0,
      },
      isBase64Encoded: false,
      body: "hello",
    } satisfies APIGatewayProxyEventV2;

    expect(convertFrom(event)).toEqual({
      type: "v2",
      method: "POST",
      rawPath: "/docs",
      queryString: "page=2",
      url: "https://docs.example.com/docs?page=2",
      body: Buffer.from("hello"),
      headers: {
        host: "docs.example.com",
        "x-forwarded-host": "docs.example.com",
        "x-forwarded-protocol": "https",
        cookie: "theme=dark; session=abc",
      },
      remoteAddress: "203.0.113.10",
    });
  });

  it("normalizes API Gateway v1 events", () => {
    const event = {
      body: "aGVsbG8=",
      headers: { Host: "example.com" },
      httpMethod: "POST",
      isBase64Encoded: true,
      multiValueHeaders: { "x-test": ["one", "two"] },
      multiValueQueryStringParameters: { tag: ["a", "b"] },
      path: "/legacy",
      pathParameters: null,
      queryStringParameters: { page: "1" },
      requestContext: {
        accountId: "123",
        apiId: "api",
        authorizer: null,
        httpMethod: "POST",
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          clientCert: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: "198.51.100.20",
          user: null,
          userAgent: null,
          userArn: null,
        },
        path: "/legacy",
        protocol: "HTTP/1.1",
        requestId: "request-id",
        requestTimeEpoch: 0,
        resourceId: "resource-id",
        resourcePath: "/legacy",
        stage: "prod",
      },
      resource: "/legacy",
      stageVariables: null,
    } satisfies APIGatewayProxyEvent;

    expect(convertFrom(event)).toMatchObject({
      type: "v1",
      method: "POST",
      rawPath: "/legacy",
      queryString: "tag=a&tag=b&page=1",
      url: "https://example.com/legacy?tag=a&tag=b&page=1",
      headers: {
        host: "example.com",
        "x-test": "one,two",
      },
      remoteAddress: "198.51.100.20",
    });
    expect(convertFrom(event).body.toString()).toBe("hello");
  });

  it("normalizes CloudFront events", () => {
    const event = {
      Records: [
        {
          cf: {
            config: {
              distributionDomainName: "example.cloudfront.net",
              distributionId: "dist-id",
              eventType: "viewer-request",
              requestId: "request-id",
            },
            request: {
              clientIp: "192.0.2.15",
              method: "GET",
              uri: "/edge",
              querystring: "preview=1",
              headers: {
                host: [{ key: "Host", value: "example.com" }],
              },
            },
          },
        },
      ],
    } satisfies CloudFrontRequestEvent;

    expect(convertFrom(event)).toMatchObject({
      type: "cf",
      method: "GET",
      rawPath: "/edge",
      queryString: "preview=1",
      url: "https://example.com/edge?preview=1",
      remoteAddress: "192.0.2.15",
    });
  });
});

describe("convertTo", () => {
  it("builds API Gateway v2 responses with cookies", async () => {
    const response = new Response("ok", {
      status: 201,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "set-cookie": "theme=dark; Path=/",
      },
    });

    await expect(
      convertTo({
        type: "v2",
        response,
        cookies: ["session=abc; Path=/; HttpOnly"],
      })
    ).resolves.toEqual({
      statusCode: 201,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
      cookies: ["theme=dark;path=/;", "session=abc;path=/;httpOnly;"],
      body: "ok",
      isBase64Encoded: false,
    });
  });

  it("base64-encodes binary API Gateway v1 responses", async () => {
    const response = new Response(Uint8Array.from([0, 1, 2, 3]), {
      status: 200,
      headers: {
        "content-type": "image/png",
      },
    });

    await expect(convertTo({ type: "v1", response })).resolves.toEqual({
      statusCode: 200,
      headers: {
        "content-type": "image/png",
      },
      multiValueHeaders: {},
      body: "AAECAw==",
      isBase64Encoded: true,
    });
  });

  it("builds CloudFront responses", async () => {
    const response = new Response("hello", {
      status: 202,
      headers: {
        "content-type": "text/plain",
      },
    });

    await expect(convertTo({ type: "cf", response })).resolves.toEqual({
      status: "202",
      statusDescription: "OK",
      headers: {
        "content-type": [{ key: "content-type", value: "text/plain" }],
      },
      bodyEncoding: "text",
      body: "hello",
    });
  });
});
