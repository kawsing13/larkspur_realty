// Minimal OpenAPI description served at /api/docs by swagger-ui-express.
// Hand-written on purpose: it stays small and readable, and grows one block per
// endpoint as phases land.

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'integer' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  },
};

const authResult = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    user: { $ref: '#/components/schemas/User' },
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Real Estate Management API',
    version: '0.1.0',
    description:
      'REST API for the Real Estate Management & Property Listing Platform. ' +
      'Endpoints marked 501 are planned for a later phase.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'INVITED'] },
          roles: { type: 'array', items: { type: 'string' } },
          agentId: { type: 'string', nullable: true },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created; refresh cookie set',
            content: { 'application/json': { schema: authResult } },
          },
          409: errorResponse,
          422: errorResponse,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Signed in', content: { 'application/json': { schema: authResult } } },
          401: errorResponse,
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange the refresh cookie for a new access token',
        responses: {
          200: { description: 'New token pair', content: { 'application/json': { schema: authResult } } },
          401: errorResponse,
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke the current refresh token',
        responses: { 204: { description: 'Signed out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'The signed-in user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          401: errorResponse,
        },
      },
    },
    '/properties': {
      get: {
        tags: ['Properties'],
        summary: 'List published properties (public)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', maximum: 50 } },
          { name: 'listingMode', in: 'query', schema: { type: 'string', enum: ['SALE', 'RENT'] } },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc'] },
          },
        ],
        responses: { 200: { description: 'Paginated property cards' } },
      },
      post: {
        tags: ['Properties (staff)'],
        summary: 'Create a property (starts as DRAFT). Permission: property:create',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created property' }, 422: errorResponse },
      },
    },
    '/properties/{key}': {
      get: {
        tags: ['Properties'],
        summary: 'One published property by id or reference (public)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Full property detail' }, 404: errorResponse },
      },
    },
    '/properties/manage': {
      get: {
        tags: ['Properties (staff)'],
        summary: 'List properties you can manage',
        description: 'Agents see their own; admins and property managers see all.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] } },
        ],
        responses: { 200: { description: 'Paginated property cards' }, 403: errorResponse },
      },
    },
    '/properties/manage/{id}': {
      get: {
        tags: ['Properties (staff)'],
        summary: 'Full property detail for editing (any status)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Property' }, 403: errorResponse, 404: errorResponse },
      },
    },
    '/properties/{id}': {
      patch: {
        tags: ['Properties (staff)'],
        summary: 'Update property fields. Permission: property:update',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated property' }, 403: errorResponse },
      },
    },
    '/properties/{id}/location': {
      put: {
        tags: ['Properties (staff)'],
        summary: 'Create or replace the property location',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Property with location' } },
      },
    },
    '/properties/{id}/amenities': {
      put: {
        tags: ['Properties (staff)'],
        summary: 'Replace the amenity set (array of slugs)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Property with amenities' } },
      },
    },
    '/properties/{id}/images': {
      post: {
        tags: ['Properties (staff)'],
        summary: 'Upload a photo (multipart form field "image", <= 5 MB)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Created image' }, 422: errorResponse },
      },
    },
    '/properties/{id}/images/{imageId}': {
      patch: {
        tags: ['Properties (staff)'],
        summary: 'Set cover / caption / order for a photo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'imageId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Updated image' } },
      },
      delete: {
        tags: ['Properties (staff)'],
        summary: 'Delete a photo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'imageId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/properties/{id}/archive': {
      post: {
        tags: ['Properties (staff)'],
        summary: 'Archive a property. Permission: property:delete',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Archived property' } },
      },
    },
    '/properties/{id}/status': {
      patch: {
        tags: ['Properties (staff)'],
        summary: 'Set status: DRAFT | PUBLISHED | UNPUBLISHED | ARCHIVED. Permission: property:publish',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated property' }, 403: errorResponse },
      },
    },
    '/property-types': {
      get: {
        tags: ['Catalog'],
        summary: 'List property types (public)',
        responses: { 200: { description: 'Property types' } },
      },
      post: {
        tags: ['Catalog'],
        summary: 'Add a property type (admin only)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' }, 403: errorResponse },
      },
    },
    '/amenities': {
      get: {
        tags: ['Catalog'],
        summary: 'List amenities (public)',
        responses: { 200: { description: 'Amenities' } },
      },
      post: {
        tags: ['Catalog'],
        summary: 'Add an amenity (admin only)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' }, 403: errorResponse },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Search published properties (public)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'keyword' },
          { name: 'listingMode', in: 'query', schema: { type: 'string', enum: ['SALE', 'RENT'] } },
          { name: 'propertyType', in: 'query', schema: { type: 'string' }, description: 'slug' },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'minBeds', in: 'query', schema: { type: 'integer' } },
          { name: 'minBaths', in: 'query', schema: { type: 'integer' } },
          { name: 'minFloorAreaSqm', in: 'query', schema: { type: 'number' } },
          { name: 'maxFloorAreaSqm', in: 'query', schema: { type: 'number' } },
          {
            name: 'amenities',
            in: 'query',
            schema: { type: 'string' },
            description: 'comma-separated slugs; a match must have all of them',
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['newest', 'price_asc', 'price_desc', 'beds_desc', 'area_desc'],
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', maximum: 50 } },
        ],
        responses: { 200: { description: 'Paginated property cards' }, 422: errorResponse },
      },
    },
    '/search/facets': {
      get: {
        tags: ['Search'],
        summary: 'Cities with listings and the price range per mode (for the filter UI)',
        responses: { 200: { description: '{ cities, priceRange }' } },
      },
    },
    '/favorites': {
      get: {
        tags: ['Favorites'],
        summary: "The customer's saved properties (cards)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Saved property cards' }, 403: errorResponse },
      },
      post: {
        tags: ['Favorites'],
        summary: 'Save a property (idempotent)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { propertyId: { type: 'string' } } },
            },
          },
        },
        responses: { 201: { description: 'Saved' }, 403: errorResponse, 404: errorResponse },
      },
    },
    '/favorites/ids': {
      get: {
        tags: ['Favorites'],
        summary: 'Just the saved property ids (for filling in hearts)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: '{ propertyIds: [...] }' } },
      },
    },
    '/favorites/{propertyId}': {
      delete: {
        tags: ['Favorites'],
        summary: 'Remove a saved property',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 204: { description: 'Removed' } },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change your password (revokes other sessions)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 204: { description: 'Changed' }, 400: errorResponse },
      },
    },
    '/listings': {
      get: {
        tags: ['Listings (workflow)'],
        summary: 'List listings you can see (agent: own; admin/manager: all)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] } },
        ],
        responses: { 200: { description: 'Paginated listings with property summary' } },
      },
    },
    '/listings/{id}': {
      get: {
        tags: ['Listings (workflow)'],
        summary: 'One listing with its full status history',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Listing' }, 403: errorResponse, 404: errorResponse },
      },
    },
    '/listings/{id}/{action}': {
      post: {
        tags: ['Listings (workflow)'],
        summary:
          'Run a workflow action: submit | withdraw | approve | request-changes | ' +
          'unpublish | republish | close | archive | restore',
        description:
          'The service enforces which role may run which action and which status it is valid from. ' +
          'request-changes needs body.note; close accepts body.outcome (SOLD | RENTED).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'action', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  note: { type: 'string' },
                  outcome: { type: 'string', enum: ['SOLD', 'RENTED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated listing' },
          400: errorResponse,
          403: errorResponse,
        },
      },
    },
    '/agents': {
      get: {
        tags: ['Agents'],
        summary: 'Agent directory',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
        ],
        responses: { 200: { description: 'Paginated agents' }, 403: errorResponse },
      },
      post: {
        tags: ['Agents'],
        summary: 'Create an agent account (admin). Needs a temporary password.',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created agent' }, 403: errorResponse, 409: errorResponse },
      },
    },
    '/agents/me': {
      get: {
        tags: ['Agents'],
        summary: "The signed-in agent's own profile + performance",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Agent' }, 403: errorResponse },
      },
      patch: {
        tags: ['Agents'],
        summary: 'Edit your own profile (title, bio, photo, phone)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Updated agent' } },
      },
    },
    '/agents/{id}': {
      get: {
        tags: ['Agents'],
        summary: 'One agent + performance (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Agent' }, 403: errorResponse },
      },
      patch: {
        tags: ['Agents'],
        summary: 'Edit an agent (admin): title, bio, license, status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated agent' }, 403: errorResponse },
      },
    },
    '/agents/{id}/public': {
      get: {
        tags: ['Agents'],
        summary: "Public agent profile with the agent's live listings",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '{ agent, listings }' }, 404: errorResponse },
      },
    },
    '/inquiries': {
      post: {
        tags: ['Inquiries (CRM)'],
        summary: 'Submit an inquiry from a listing page (public, rate-limited)',
        description: 'Auto-assigns to the listing agent. optionalAuth links it to a signed-in customer.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId', 'name', 'email', 'message'],
                properties: {
                  propertyId: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: '{ id }' }, 422: errorResponse, 429: errorResponse },
      },
      get: {
        tags: ['Inquiries (CRM)'],
        summary: 'List leads (agent: own; admin/manager: all)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'agentId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'followUpDue', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] } },
        ],
        responses: { 200: { description: 'Paginated leads' }, 403: errorResponse },
      },
    },
    '/inquiries/mine': {
      get: {
        tags: ['Inquiries (CRM)'],
        summary: "A customer's own inquiry history",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Inquiries' }, 403: errorResponse },
      },
    },
    '/inquiries/{id}': {
      get: {
        tags: ['Inquiries (CRM)'],
        summary: 'Lead detail + interaction timeline',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Inquiry' }, 403: errorResponse, 404: errorResponse },
      },
      patch: {
        tags: ['Inquiries (CRM)'],
        summary: 'Update lead status and/or follow-up date (assigned agent or admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  followUpDate: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated inquiry' }, 403: errorResponse },
      },
    },
    '/inquiries/{id}/notes': {
      post: {
        tags: ['Inquiries (CRM)'],
        summary: 'Add a note to the lead timeline',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated inquiry' }, 403: errorResponse },
      },
    },
    '/inquiries/{id}/assign': {
      post: {
        tags: ['Inquiries (CRM)'],
        summary: 'Assign / reassign the lead to an agent. Permission: inquiry:assign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['agentId'],
                properties: { agentId: { type: 'string' }, reason: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated inquiry' }, 403: errorResponse },
      },
    },
    '/appointments': {
      post: {
        tags: ['Appointments'],
        summary: 'Request a viewing (public, rate-limited)',
        description:
          'Auto-assigns to the listing agent as REQUESTED. A staff member passing an ' +
          'inquiryId they handle gets a CONFIRMED slot straight away.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId', 'requestedStart', 'contactName', 'contactEmail'],
                properties: {
                  propertyId: { type: 'string' },
                  inquiryId: { type: 'string' },
                  requestedStart: { type: 'string', format: 'date-time' },
                  requestedEnd: { type: 'string', format: 'date-time' },
                  contactName: { type: 'string' },
                  contactEmail: { type: 'string', format: 'email' },
                  contactPhone: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: '{ id, status }' }, 422: errorResponse, 429: errorResponse },
      },
      get: {
        tags: ['Appointments'],
        summary: 'Staff schedule (agent: own; admin/manager: all)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'upcoming', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] } },
        ],
        responses: { 200: { description: 'Paginated appointments' }, 403: errorResponse },
      },
    },
    '/appointments/mine': {
      get: {
        tags: ['Appointments'],
        summary: "A customer's own viewing requests",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Appointments' }, 403: errorResponse },
      },
    },
    '/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Appointment detail (staff owner or the owning customer)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Appointment' }, 403: errorResponse, 404: errorResponse },
      },
    },
    '/properties/{key}/brochure.pdf': {
      get: {
        tags: ['Properties'],
        summary: 'A one-page property brochure as a PDF (public)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'application/pdf' }, 404: errorResponse },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List a property\'s documents you can see (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'propertyId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Documents' }, 403: errorResponse },
      },
      post: {
        tags: ['Documents'],
        summary: 'Upload a document (multipart: file, propertyId, title, docType, visibility)',
        description: 'Stored in a private bucket. Permission: property:update + ownership.',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created document' }, 403: errorResponse, 422: errorResponse },
      },
    },
    '/documents/{id}': {
      patch: {
        tags: ['Documents'],
        summary: 'Change title / type / visibility',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated document' } },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete a document (also removes the stored file)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/documents/{id}/download': {
      get: {
        tags: ['Documents'],
        summary: 'Download a document (access-checked; PUBLIC needs no token)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'The file' },
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: "The caller's notifications + unread count",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: '{ data, unreadCount }' } },
      },
    },
    '/notifications/{id}/read': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark one notification read',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Done' } },
      },
    },
    '/notifications/read-all': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark all read',
        security: [{ bearerAuth: [] }],
        responses: { 204: { description: 'Done' } },
      },
    },
    '/reports/overview': {
      get: {
        tags: ['Reports'],
        summary: 'Operations metrics + lead funnel + top properties (report:read)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Overview' }, 403: errorResponse },
      },
    },
    '/reports/agents': {
      get: {
        tags: ['Reports'],
        summary: 'Per-agent performance (report:read)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Agent rows' } },
      },
    },
    '/reports/summary.pdf': {
      get: {
        tags: ['Reports'],
        summary: 'The overview + agent table as a PDF (report:read)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'application/pdf' } },
      },
    },
    '/saved-searches': {
      get: {
        tags: ['Saved searches'],
        summary: "The customer's saved searches with current match counts",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Saved searches' }, 403: errorResponse },
      },
      post: {
        tags: ['Saved searches'],
        summary: 'Save a search ({ name, criteria }). Notified on new matches.',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Saved search' }, 403: errorResponse },
      },
    },
    '/saved-searches/{id}': {
      patch: {
        tags: ['Saved searches'],
        summary: 'Rename or toggle notifications',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Saved search' } },
      },
      delete: {
        tags: ['Saved searches'],
        summary: 'Remove a saved search',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Removed' } },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit log'],
        summary: 'Authorized activity history (audit:read)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated log entries' }, 403: errorResponse },
      },
    },
    '/appointments/{id}/{action}': {
      post: {
        tags: ['Appointments'],
        summary: 'Workflow action: confirm | reschedule | cancel | complete | no-show',
        description:
          'confirm / reschedule need body.start (ISO). The service enforces who may run ' +
          'which action; a linked lead is updated and can advance a stage.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'action', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated appointment' }, 400: errorResponse, 403: errorResponse },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated users' }, 403: errorResponse },
      },
    },
    '/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Suspend or reactivate a user (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'INVITED'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated user' }, 403: errorResponse, 404: errorResponse },
      },
    },
  },
};
