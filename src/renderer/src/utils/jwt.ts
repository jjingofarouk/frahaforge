// src/renderer/src/utils/jwt.ts
// Custom JWT implementation that works in the browser

interface JwtPayload {
  userId: number | string;
  username: string;
  permissions: {
    products: number;
    categories: number;
    transactions: number;
    users: number;
    settings: number;
  };
  timestamp: number;
  exp?: number;
}

class CustomJWT {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Simple hash function for browser compatibility
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Base64 URL encode
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Base64 URL decode
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  // Create signature
  private async createSignature(header: string, payload: string): Promise<string> {
    const data = `${header}.${payload}`;
    const signature = await this.hashString(data + this.secret);
    return this.base64UrlEncode(signature);
  }

  // Verify signature
  private async verifySignature(header: string, payload: string, signature: string): Promise<boolean> {
    const expectedSignature = await this.createSignature(header, payload);
    return signature === expectedSignature;
  }

  // Generate JWT token
  async sign(payload: JwtPayload, expiresIn: string = '30d'): Promise<string> {
    // Calculate expiration
    const expiresInMs = this.parseExpiresIn(expiresIn);
    const exp = Date.now() + expiresInMs;
    
    const payloadWithExp = {
      ...payload,
      exp: Math.floor(exp / 1000) // JWT uses seconds
    };

    // Create header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payloadWithExp));

    // Create signature
    const signature = await this.createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Verify JWT token
  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const isValid = await this.verifySignature(encodedHeader, encodedPayload, signature);
      if (!isValid) {
        return null;
      }

      // Decode payload
      const payloadStr = this.base64UrlDecode(encodedPayload);
      const payload = JSON.parse(payloadStr) as JwtPayload;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  // Decode without verification (for debugging)
  decode(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payloadStr = this.base64UrlDecode(parts[1]);
      return JSON.parse(payloadStr) as JwtPayload;
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  }

  // Parse expiresIn string to milliseconds
  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'm': // minutes
        return value * 60 * 1000;
      case 's': // seconds
        return value * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000; // Default 30 days
    }
  }
}

export default CustomJWT;