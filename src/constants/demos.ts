import { ArchitectureAnalysis } from "../services/geminiService";

export interface DemoRepo {
  id: string;
  title: string;
  description: string;
  icon: string;
  analysis: ArchitectureAnalysis;
}

export const DEMO_REPOS: DemoRepo[] = [
  {
    id: "nextjs-saas",
    title: "Next.js SaaS Repository",
    description: "Visualize architecture layers and multi-tenant routing logic.",
    icon: "Layers",
    analysis: {
      projectIdea: "A modern SaaS starter kit built with Next.js, Prisma, and Stripe.",
      summary: "This repository follows a standard Next.js App Router structure with a clear separation between UI components, server actions, and database models.",
      onboardingPath: [
        { step: "Project Overview", file: "README.md", reason: "Understand the core value proposition and setup instructions." },
        { step: "Data Schema", file: "prisma/schema.prisma", reason: "The database schema defines the entire domain model of the application." },
        { step: "Main Entry Point", file: "src/app/layout.tsx", reason: "The root layout where global providers and styling are initialized." }
      ],
      components: [
        {
          name: "Frontend UI",
          description: "React components using Tailwind CSS and Radix UI.",
          layer: "Frontend",
          dependencies: ["Server Actions", "External APIs"],
          responsibilities: ["User interface", "Form handling", "Client-side state"],
          relevantFiles: ["src/components/Dashboard.tsx", "src/app/layout.tsx"],
          modificationGuide: "To add a new dashboard widget, create a component in src/components and import it into the dashboard page.",
          blastRadius: ["Server Actions"]
        },
        {
          name: "Server Actions",
          description: "Secure server-side logic for data mutations.",
          layer: "Core Logic",
          dependencies: ["Database", "External APIs"],
          responsibilities: ["Authentication checks", "Database updates", "Stripe integration"],
          relevantFiles: ["src/lib/actions/user.ts", "src/lib/actions/billing.ts"],
          modificationGuide: "When adding a new action, ensure you use the 'use server' directive and validate the user session.",
          blastRadius: ["Frontend UI", "Database (Prisma)"]
        },
        {
          name: "Database (Prisma)",
          description: "PostgreSQL schema and client generation.",
          layer: "Database",
          dependencies: [],
          responsibilities: ["Data persistence", "Schema management", "Type safety"],
          relevantFiles: ["prisma/schema.prisma"],
          modificationGuide: "After modifying the schema, run 'npx prisma generate' to update the client types.",
          blastRadius: ["Server Actions"]
        }
      ],
      dataFlow: [
        { from: "Frontend UI", to: "Server Actions", description: "Invokes mutations via form actions" },
        { from: "Server Actions", to: "Database (Prisma)", description: "Reads and writes user data" },
        { from: "Server Actions", to: "External APIs", description: "Processes payments via Stripe" }
      ],
      bottlenecks: ["Server Actions"],
      contributionHistory: "Active development on billing features and UI refinements in the last 30 days.",
      contributionGaps: [
        {
          title: "Add Dark Mode Support",
          description: "The current UI is light-only. Implement next-themes for dark mode.",
          difficulty: "Easy",
          suggestedSteps: ["Install next-themes", "Wrap layout with ThemeProvider", "Add toggle component"]
        }
      ]
    }
  },
  {
    id: "microservices-backend",
    title: "Microservices Backend",
    description: "Visualize service dependencies and message broker integration.",
    icon: "Target",
    analysis: {
      projectIdea: "A distributed e-commerce backend using Node.js and RabbitMQ.",
      summary: "A collection of independent services communicating via a central message broker for high scalability.",
      onboardingPath: [
        { step: "Infrastructure Setup", file: "docker-compose.yml", reason: "Defines the RabbitMQ and Database services required for local development." },
        { step: "Service Entry", file: "services/order/index.js", reason: "The main entry point for the Order Service, showing how it initializes and connects to the broker." }
      ],
      components: [
        {
          name: "Order Service",
          description: "Handles order creation and lifecycle management.",
          layer: "Core Logic",
          dependencies: ["Inventory Service", "Message Broker"],
          responsibilities: ["Order validation", "Payment processing trigger", "Order status tracking"],
          relevantFiles: ["services/order/index.js", "services/order/models/Order.js"],
          modificationGuide: "To add a new order status, update the Order model and the status transition logic in the service.",
          blastRadius: ["Inventory Service", "Message Broker"]
        },
        {
          name: "Inventory Service",
          description: "Manages product stock levels across warehouses.",
          layer: "Core Logic",
          dependencies: ["Database"],
          responsibilities: ["Stock checks", "Stock reservation", "Inventory updates"],
          relevantFiles: ["services/inventory/stockManager.js"],
          modificationGuide: "Modify stockManager.js to implement custom reservation timeout logic.",
          blastRadius: ["Order Service"]
        },
        {
          name: "Message Broker",
          description: "RabbitMQ instance for asynchronous communication.",
          layer: "Infrastructure",
          dependencies: [],
          responsibilities: ["Event routing", "Message persistence", "Service decoupling"],
          relevantFiles: ["infrastructure/rabbitmq/config.json"],
          modificationGuide: "Update the exchange bindings in the config to route new event types.",
          blastRadius: ["Order Service", "Inventory Service"]
        }
      ],
      dataFlow: [
        { from: "Order Service", to: "Message Broker", description: "Publishes 'order_created' events" },
        { from: "Message Broker", to: "Inventory Service", description: "Consumes events to reserve stock" }
      ],
      bottlenecks: ["Message Broker"],
      contributionHistory: "Recent focus on improving event reliability and service monitoring.",
      contributionGaps: [
        {
          title: "Implement Health Checks",
          description: "Add /health endpoints to all services for Kubernetes probes.",
          difficulty: "Medium",
          suggestedSteps: ["Add express-healthcheck", "Define custom check logic", "Update k8s manifests"]
        }
      ]
    }
  },
  {
    id: "ai-agent-framework",
    title: "AI Agent Framework",
    description: "Explore agent workflow and tool integration patterns.",
    icon: "Code",
    analysis: {
      projectIdea: "An extensible framework for building autonomous AI agents with tool-calling capabilities.",
      summary: "This framework uses a modular approach to define agents, memories, and tools, allowing for complex multi-step reasoning.",
      onboardingPath: [
        { step: "Core Reasoning", file: "src/core/orchestrator.ts", reason: "The heart of the framework where the LLM reasoning loop is implemented." },
        { step: "Tool Interface", file: "src/tools/definitions.ts", reason: "Defines how external tools are structured and called by the agent." }
      ],
      components: [
        {
          name: "Agent Orchestrator",
          description: "The central brain that manages the reasoning loop.",
          layer: "Core Logic",
          dependencies: ["LLM Provider", "Memory Store", "Tool Registry"],
          responsibilities: ["Task decomposition", "Tool selection", "Response generation"],
          relevantFiles: ["src/core/orchestrator.ts", "src/core/agent.ts"],
          modificationGuide: "To change the reasoning prompt, modify the base template in orchestrator.ts.",
          blastRadius: ["Memory Store", "Tool Registry"]
        },
        {
          name: "Tool Registry",
          description: "A dynamic repository of functions the agent can call.",
          layer: "External",
          dependencies: [],
          responsibilities: ["Tool validation", "Execution sandbox", "Result formatting"],
          relevantFiles: ["src/tools/registry.ts", "src/tools/definitions.ts"],
          modificationGuide: "Add new tools by implementing the ITool interface and registering them in registry.ts.",
          blastRadius: ["Agent Orchestrator"]
        },
        {
          name: "Memory Store",
          description: "Persistent and short-term memory for agent context.",
          layer: "Database",
          dependencies: [],
          responsibilities: ["Context retrieval", "Conversation history", "Vector embeddings"],
          relevantFiles: ["src/memory/vectorStore.ts", "src/memory/shortTerm.ts"],
          modificationGuide: "Switch vector providers by implementing a new adapter in the memory directory.",
          blastRadius: ["Agent Orchestrator"]
        }
      ],
      dataFlow: [
        { from: "Agent Orchestrator", to: "LLM Provider", description: "Sends prompts and receives completions" },
        { from: "Agent Orchestrator", to: "Tool Registry", description: "Executes external functions" },
        { from: "Agent Orchestrator", to: "Memory Store", description: "Stores and retrieves context" }
      ],
      bottlenecks: ["LLM Provider"],
      contributionHistory: "Intense work on memory retrieval optimization and tool sandboxing.",
      contributionGaps: [
        {
          title: "Add Search Tool",
          description: "Implement a Google Search tool using the SerpAPI.",
          difficulty: "Medium",
          suggestedSteps: ["Create searchTool.ts", "Implement SerpAPI call", "Register in Tool Registry"]
        }
      ]
    }
  }
];
