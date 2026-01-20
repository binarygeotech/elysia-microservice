# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently supported:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please send an email to **security@yourdomain.com** (or create a private security advisory on GitHub).

### What to Include

Please include the following information in your report:

- **Description**: A clear description of the vulnerability
- **Impact**: What an attacker could do with this vulnerability
- **Affected versions**: Which versions are affected
- **Reproduction steps**: Step-by-step instructions to reproduce the issue
- **Proof of concept**: Code or configuration that demonstrates the vulnerability (if applicable)
- **Suggested fix**: If you have ideas on how to fix it (optional)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
2. **Initial Assessment**: We will provide an initial assessment within 5 business days
3. **Updates**: We will keep you informed of the progress toward fixing the vulnerability
4. **Disclosure**: We will coordinate disclosure with you once the vulnerability is fixed
5. **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

### Security Update Process

1. The security team will investigate and validate the report
2. A private fix will be developed and tested
3. A security advisory will be drafted
4. A new version will be released with the fix
5. The security advisory will be published
6. Users will be notified through:
   - GitHub Security Advisory
   - npm security advisory
   - GitHub Releases
   - Project discussions

## Security Best Practices

When using Elysia Microservice Framework:

### Transport Security

**Use TLS for production:**
```typescript
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({
    server: {
      transport: 'tls',  // Use TLS instead of TCP
      options: {
        port: 4000,
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
      }
    }
  }));
```

### Input Validation

**Always validate input data:**
```typescript
import { t } from 'elysia';

app.onMsMessage('user.create', async (ctx) => {
  // Validate input before processing
  const schema = t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    email: t.String({ format: 'email' })
  });
  
  // Add validation logic
  return { success: true };
});
```

### Authentication & Authorization

**Implement authentication using hooks:**
```typescript
registry.setRequestHooks({
  onBefore: async (ctx) => {
    const token = ctx.meta?.token;
    if (!isValidToken(token)) {
      throw new Error('Unauthorized');
    }
  }
});
```

### Rate Limiting

**Implement rate limiting to prevent abuse:**
```typescript
import { withResilience } from '@elysia-microservice/client-base';

const client = withResilience(baseClient, {
  timeout: 5000,
  retries: 3,
  breakerThreshold: 5
});
```

### Error Handling

**Don't expose sensitive information in errors:**
```typescript
registry.setRequestErrorHandler(async (error, ctx) => {
  // Log full error internally
  console.error('Error:', error);
  
  // Return sanitized error to client
  return {
    error: 'An error occurred',
    code: 'INTERNAL_ERROR'
  };
});
```

### Dependency Security

**Keep dependencies up to date:**
```bash
# Check for vulnerabilities
make deps-audit

# Update dependencies
make deps-update
```

## Known Security Considerations

### Pattern Matching

- Be cautious with catchall patterns (`.*` or `**`) as they may inadvertently handle sensitive patterns
- Use specific patterns when possible
- Implement authorization checks in handlers, not just in pattern matching

### Message Size Limits

- Configure appropriate message size limits to prevent memory exhaustion
- Implement timeout mechanisms for long-running handlers

### Service Discovery

- Secure service discovery endpoints
- Validate discovered service endpoints before use
- Use authentication when communicating with service registries

## Security Advisories

Security advisories will be published on:

- [GitHub Security Advisories](https://github.com/yourusername/elysia-microservice/security/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)

## Security Hall of Fame

We recognize and thank the following individuals for responsibly disclosing security vulnerabilities:

<!-- Security researchers will be listed here -->

---

**Note:** This security policy is subject to change. Please check back regularly for updates.

Last updated: January 20, 2026
