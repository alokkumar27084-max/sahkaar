# Backend service overview

This backend provides the server-side functionality for the SahKaar platform, including authentication, contractor and customer workflows, booking operations, reviews, admin operations, and secure transaction processing.

## Core responsibilities

- User authentication and role-based access
- Worker registration and profile management
- Service discovery and local listing logic
- Booking and scheduling workflows
- Review and reputation handling
- Admin and governance operations
- Payments and transaction processing
- Real-time communication and notifications

## Local development

```bash
cd backend
npm install
npm run dev
```

## Notes

- Keep all local and production secrets outside the repository.
- Do not commit private environment files or deployment credentials.
- Production deployment details are intentionally omitted from the public repository for security and operational safety.

## API and product docs

- OpenAPI documentation is available under `backend/openapi.yaml`
- Product overview and feature details are documented in the root README and `docs/features`

## Security guidance

- Only include generic setup information in public documentation.
- Restrict production configuration, infrastructure references, and secret values to secure internal environments.
