transcendence/
├── docker-compose.yml      # PostgreSQL + Backend services
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── backend/
│   ├── Dockerfile.dev     # Dev container (Node 20 Alpine)
│   ├── package.json       # NestJS + all dependencies
│   ├── tsconfig.json      # TypeScript config
│   ├── nest-cli.json      # NestJS CLI config
│   ├── prisma/
│   │   └── schema.prisma  # Database schema (User, Friend, Game)
│   └── src/
│       ├── main.ts        # App entry with Swagger setup
│       ├── app.module.ts  # Root module with throttling
│       ├── app.controller.ts
│       ├── app.service.ts
│       └── prisma/        # PrismaService singleton