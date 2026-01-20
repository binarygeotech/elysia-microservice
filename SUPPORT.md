# Support

Thank you for using Elysia Microservice Framework! This document provides guidance on how to get help.

## 📚 Documentation

Before seeking support, please check our comprehensive documentation:

- **[Getting Started Guide](docs/guides/getting-started.md)** - Quick start for new users
- **[API Reference](docs/api/core.md)** - Complete API documentation
- **[Pattern Matching Guide](docs/guides/PATTERN_MATCHING.md)** - Pattern matching examples
- **[Advanced Features](docs/guides/advanced-features.md)** - Hooks, resilience, and more
- **[FAQ](#frequently-asked-questions)** - Common questions and answers

## 💬 Getting Help

### GitHub Discussions

For questions, ideas, and community discussion:

👉 [GitHub Discussions](https://github.com/yourusername/elysia-microservice/discussions)

**Best for:**
- General questions about usage
- Architecture and design discussions
- Sharing your projects
- Feature discussions
- Community help

### GitHub Issues

For bug reports and feature requests:

👉 [GitHub Issues](https://github.com/yourusername/elysia-microservice/issues)

**Best for:**
- Reporting bugs
- Requesting new features
- Documentation improvements

Please use our issue templates to ensure you provide all necessary information.

### Stack Overflow

Ask questions with the tag `elysia-microservice`:

👉 [Stack Overflow](https://stackoverflow.com/questions/tagged/elysia-microservice)

**Best for:**
- Technical questions
- Implementation help
- Code examples

## 🐛 Reporting Bugs

If you've found a bug, please report it using our [Bug Report Template](https://github.com/yourusername/elysia-microservice/issues/new?template=bug_report.yml).

**Include:**
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Package versions
- Runtime and OS information
- Minimal reproduction code
- Error logs

## 💡 Feature Requests

We welcome feature suggestions! Use our [Feature Request Template](https://github.com/yourusername/elysia-microservice/issues/new?template=feature_request.yml).

**Include:**
- Problem statement
- Proposed solution
- Use cases
- Example implementation (if you have ideas)

## 🔒 Security Issues

**Do not report security vulnerabilities through public issues.**

Please see our [Security Policy](SECURITY.md) for how to report security issues.

## 💼 Commercial Support

For commercial support, consulting, or custom development:

- **Email:** support@yourdomain.com
- **GitHub Discussions:** [Commercial Support](https://github.com/yourusername/elysia-microservice/discussions)

We offer:
- Priority bug fixes
- Custom feature development
- Architecture consulting
- Training and workshops
- SLA-based support

## 🤝 Contributing

Want to help improve the project? Check our [Contributing Guide](CONTRIBUTING.md).

## 📧 Contact

- **General inquiries:** hello@yourdomain.com
- **Security issues:** security@yourdomain.com
- **Commercial support:** support@yourdomain.com

## Response Times

| Channel | Expected Response Time |
|---------|----------------------|
| GitHub Issues | 2-5 business days |
| GitHub Discussions | 1-3 business days |
| Security Issues | Within 48 hours |
| Commercial Support | Within 24 hours |

*Note: Response times are estimates and may vary based on complexity and volume.*

## Frequently Asked Questions

### General

**Q: Which transport should I use?**

A: Start with TCP for development. Use:
- **TCP**: Simple, fast, good for development
- **TLS**: Production-ready with encryption
- **NATS**: Distributed systems with pub/sub
- **Redis**: When you already use Redis
- **Kafka**: Event streaming, high throughput

**Q: Can I use this in production?**

A: Yes, but ensure you:
- Use TLS transport for security
- Implement proper error handling
- Add authentication/authorization
- Use resilience patterns (retries, circuit breakers)
- Monitor your services

**Q: Is this compatible with NestJS?**

A: Yes! Use the `@elysia-microservice/adapters` package for NestJS compatibility.

### Installation

**Q: Which runtime do you recommend?**

A: We recommend [Bun](https://bun.sh/) for the best performance, but Node.js >= 18 is also supported.

**Q: Do I need to install all packages?**

A: No! Only install what you need:
```bash
# Minimal setup
bun add @elysia-microservice/core @elysia-microservice/transport-tcp @elysia-microservice/client-tcp elysia
```

### Usage

**Q: How do I handle authentication?**

A: Use lifecycle hooks:
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

**Q: Can I mix HTTP and microservice handlers?**

A: Yes! Use hybrid mode:
```typescript
const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true 
  }))
  .get('/api/users', () => { /* HTTP */ })
  .onMsMessage('get.user', (ctx) => { /* Microservice */ });
```

**Q: How do I handle errors?**

A: Set global error handlers:
```typescript
registry.setRequestErrorHandler(async (error, ctx) => {
  console.error('Error:', error);
  return { error: error.message };
});
```

### Development

**Q: How do I run tests?**

A: Use our Makefile:
```bash
make test        # All tests
make test-unit   # Unit tests only
```

**Q: How do I build packages?**

A: 
```bash
make build       # Build all packages
make rebuild     # Clean and rebuild
```

### Troubleshooting

**Q: Port already in use?**

A: Change the port or kill the process:
```bash
lsof -ti:4000 | xargs kill -9
```

**Q: Cannot connect to microservice?**

A: Check:
1. Server is running
2. Port and host match
3. Firewall settings
4. For NATS/Redis/Kafka, verify broker is running

**Q: Type errors with MessageContext?**

A: Ensure you're using the latest version and have proper TypeScript configuration.

## 🌟 More Resources

- [Examples Directory](examples/) - Working examples
- [Architecture Documentation](docs/ARCHITECTURE.md) - System design
- [Migration Guide](docs/MIGRATION.md) - Upgrading guide
- [Changelog](CHANGELOG.md) - Version history

---

**Still need help?** Open a [discussion](https://github.com/yourusername/elysia-microservice/discussions) and the community will assist you!
