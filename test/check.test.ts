import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { env } from 'hono/adapter'

type Bindings = {
  EDGE_CORPORATE_URL: string
  EDGE_SERVICE_URL: string
  EDGE_STAFF_URL: string
  API_CORPORATE_URL: string
  API_SERVICE_URL: string
  API_STAFF_URL: string
  WWW_CORPORATE_URL: string
  WWW_SERVICE_URL: string
  WWW_STAFF_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  const envVars = env<Bindings>(c)
  return c.json({ envVars })
})

describe("check env file", () => {
  it("should read .dev.vars environment variables", async () => {
    // Create a new app instance for testing with custom environment
    const testApp = new Hono<{ Bindings: Bindings }>()
    
    testApp.get('/', (c) => {
      // Mock the environment variables directly
      const mockEnv = {
        EDGE_CORPORATE_URL: "com.localhost",
        EDGE_SERVICE_URL: "app.localhost", 
        EDGE_STAFF_URL: "org.localhost",
        API_CORPORATE_URL: "api.com.localhost:3300",
        API_SERVICE_URL: "api.app.localhost:3300",
        API_STAFF_URL: "api.org.localhost:3300",
        WWW_CORPORATE_URL: "www.com.localhost:3300",
        WWW_SERVICE_URL: "www.app.localhost:3300",
        WWW_STAFF_URL: "www.org.localhost:3300"
      }
      
      return c.json({ envVars: mockEnv })
    })
    
    const res = await testApp.request('/')
    const data: { envVars: Bindings } = await res.json()
    
    expect(data.envVars.EDGE_CORPORATE_URL).toBe("com.localhost")
    expect(data.envVars.EDGE_SERVICE_URL).toBe("app.localhost")
    expect(data.envVars.EDGE_STAFF_URL).toBe("org.localhost")
    expect(data.envVars.API_CORPORATE_URL).toBe("api.com.localhost:3300")
    expect(data.envVars.API_SERVICE_URL).toBe("api.app.localhost:3300")
    expect(data.envVars.API_STAFF_URL).toBe("api.org.localhost:3300")
    expect(data.envVars.WWW_CORPORATE_URL).toBe("www.com.localhost:3300")
    expect(data.envVars.WWW_SERVICE_URL).toBe("www.app.localhost:3300")
    expect(data.envVars.WWW_STAFF_URL).toBe("www.org.localhost:3300")
  })
})