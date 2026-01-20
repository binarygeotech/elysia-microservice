export function createRegistry() {
  const requests = new Map<string, any>();
  const events = new Map<string, any>();
  const clients = new Map<string, any>();
  
  // Catchall handlers for unmatched patterns
  let catchallRequestHandler: any = null;
  let catchallEventHandler: any = null;

  function registerMessage(pattern: string, handler: any) {
    requests.set(pattern, handler);
  }

  function registerEvent(pattern: string, handler: any) {
    events.set(pattern, handler);
  }

  function registerClient(name: string, client: any) {
    clients.set(name, client);
  }

  // Register catchall handler for unmatched request patterns
  function registerCatchallMessage(handler: any) {
    catchallRequestHandler = handler;
  }

  // Register catchall handler for unmatched event patterns
  function registerCatchallEvent(handler: any) {
    catchallEventHandler = handler;
  }

  // Convert wildcard pattern to regex (e.g., "users.*" -> /^users\..+$/)
  function wildcardToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Replace * with .*
    return new RegExp(`^${escaped}$`);
  }

  // Find matching handler for a pattern (supports exact, wildcard, and regex)
  function findHandler(
    pattern: string,
    map: Map<string, any>,
    catchallHandler: any
  ): { handler: any; matchedPattern: string | null } {
    // 1. Try exact match first (fastest)
    if (map.has(pattern)) {
      return { handler: map.get(pattern), matchedPattern: pattern };
    }

    // 2. Try wildcard/regex patterns
    for (const [registeredPattern, handler] of map.entries()) {
      // Check if pattern contains wildcards or looks like regex
      if (registeredPattern.includes('*') || registeredPattern.startsWith('/')) {
        let regex: RegExp;
        
        if (registeredPattern.startsWith('/') && registeredPattern.includes('/')) {
          // Regex pattern format: /pattern/flags
          const parts = registeredPattern.split('/');
          const regexPattern = parts[1];
          const flags = parts[2] || '';
          regex = new RegExp(regexPattern, flags);
        } else {
          // Wildcard pattern (e.g., "users.*")
          regex = wildcardToRegex(registeredPattern);
        }

        if (regex.test(pattern)) {
          return { handler, matchedPattern: registeredPattern };
        }
      }
    }

    // 3. Fall back to catchall handler if no match found
    // Wrap catchall to inject the pattern as first argument
    if (catchallHandler) {
      return { 
        handler: (data: any, ctx?: any) => catchallHandler(pattern, data, ctx),
        matchedPattern: null 
      };
    }

    return { handler: null, matchedPattern: null };
  }

  // Get handler for request pattern
  function getRequestHandler(pattern: string) {
    return findHandler(pattern, requests, catchallRequestHandler);
  }

  // Get handler for event pattern
  function getEventHandler(pattern: string) {
    return findHandler(pattern, events, catchallEventHandler);
  }

  return {
    requests,
    events,
    clients,
    registerMessage,
    registerEvent,
    registerClient,
    registerCatchallMessage,
    registerCatchallEvent,
    getRequestHandler,
    getEventHandler,
  };
}
